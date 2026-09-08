import { cookies } from "next/headers";
import { db } from "@/db";
import { users, rooms, messages, meetings } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { DEFAULT_ME, DEMO_MEMBERS, ROOM_DATA } from "@/lib/workspace";

const DDL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS gx_rooms (id text PRIMARY KEY, name text NOT NULL, description text NOT NULL, kind text NOT NULL, capacity integer NOT NULL DEFAULT 8, color text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS gx_users (id text PRIMARY KEY, name text NOT NULL, role text NOT NULL DEFAULT 'Membro do ecossistema', company text NOT NULL DEFAULT 'Grupo X', avatar text NOT NULL DEFAULT '', color text NOT NULL DEFAULT '#c7a66e', room_id text NOT NULL DEFAULT 'recepcao', status text NOT NULL DEFAULT 'available', x real NOT NULL DEFAULT 61, y real NOT NULL DEFAULT 73, is_demo boolean NOT NULL DEFAULT false, hand_raised boolean NOT NULL DEFAULT false, call_room text, mic_enabled boolean NOT NULL DEFAULT false, camera_enabled boolean NOT NULL DEFAULT false, last_seen timestamptz NOT NULL DEFAULT now())`,
  `CREATE TABLE IF NOT EXISTS gx_messages (id text PRIMARY KEY, sender_id text NOT NULL REFERENCES gx_users(id), room_id text NOT NULL DEFAULT 'geral', content text NOT NULL, created_at timestamptz NOT NULL DEFAULT now())`,
  `CREATE INDEX IF NOT EXISTS gx_messages_created_at_idx ON gx_messages (created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS gx_meetings (id text PRIMARY KEY, title text NOT NULL, description text NOT NULL DEFAULT '', room_id text NOT NULL REFERENCES gx_rooms(id), starts_at timestamptz NOT NULL, duration integer NOT NULL DEFAULT 30, organizer_id text NOT NULL REFERENCES gx_users(id), created_at timestamptz NOT NULL DEFAULT now())`,
  `CREATE INDEX IF NOT EXISTS gx_meetings_starts_at_idx ON gx_meetings (starts_at)`,
  `CREATE TABLE IF NOT EXISTS gx_signals (id serial PRIMARY KEY, from_id text NOT NULL, to_id text NOT NULL, room_id text NOT NULL, payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now())`,
  `CREATE INDEX IF NOT EXISTS gx_signals_to_id_idx ON gx_signals (to_id, id)`,
  `CREATE TABLE IF NOT EXISTS gx_invitations (id text PRIMARY KEY, created_by text NOT NULL REFERENCES gx_users(id), expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now())`,
];

let seedPromise: Promise<void> | undefined;
export function seedWorkspace() {
  if (!seedPromise) seedPromise = seed().catch(error => { seedPromise = undefined; throw error; });
  return seedPromise;
}
async function seed() {
  for (const statement of DDL_STATEMENTS) {
    try {
      await db.execute(sql.raw(statement));
    } catch (error) {
      if ((error as { code?: string })?.code !== "42P07") throw error;
    }
  }
  await db.insert(rooms).values(ROOM_DATA).onConflictDoNothing();
  await db.insert(users).values(DEMO_MEMBERS.map(member => ({ ...member, lastSeen: new Date(0) }))).onConflictDoNothing();
  const now = Date.now();
  await db.insert(messages).values([
    { id: "welcome-ana", senderId: "demo-ana", roomId: "geral", content: "Bom dia, equipe! ☀️ Vamos construir um grande dia.", createdAt: new Date(now - 1200000) },
    { id: "welcome-lucas", senderId: "demo-lucas", roomId: "geral", content: "Apresentação pronta para o nosso alinhamento! 🚀", createdAt: new Date(now - 900000) },
    { id: "welcome-mariana", senderId: "demo-mariana", roomId: "geral", content: "Nos vemos na sala de estratégia! 🙌", createdAt: new Date(now - 600000) },
  ]).onConflictDoUpdate({ target: messages.id, set: { content: sql`excluded.content` } });
  const first = new Date(); first.setHours(14, 30, 0, 0); if (first.getTime() < now) first.setDate(first.getDate() + 1);
  const second = new Date(first); second.setHours(16, 0, 0, 0);
  await db.insert(meetings).values([
    { id: "demo-meeting-strategy", title: "Alinhamento comercial", description: "Uma conversa para conectar prioridades, compartilhar resultados e definir os próximos passos do time comercial.", roomId: "estrategia", startsAt: first, duration: 30, organizerId: "demo-lucas" },
    { id: "demo-meeting-team", title: "Conexão com a equipe", description: "Nosso encontro para trocar ideias, celebrar as conquistas e construir juntos o próximo capítulo.", roomId: "coworking", startsAt: second, duration: 45, organizerId: "demo-mariana" },
  ]).onConflictDoNothing();
}
export async function getMember() {
  const jar = await cookies();
  const id = jar.get("gx_session")?.value;
  if (!id) return null;
  const [member] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return member && !member.isDemo ? member : null;
}
export async function ensureMember() {
  const existing = await getMember();
  if (existing) return existing;
  const id = crypto.randomUUID();
  const [member] = await db.insert(users).values({ ...DEFAULT_ME, id, lastSeen: new Date() }).returning();
  const jar = await cookies();
  jar.set("gx_session", id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return member;
}
export function fail(error: unknown, message = "O workspace está temporariamente indisponível. Tente novamente.") {
  console.error("GX workspace:", error);
  return Response.json({ error: message }, { status: 500 });
}
