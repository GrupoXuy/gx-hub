import { cookies } from "next/headers";
import { db } from "@/db";
import { users, rooms, messages, meetings } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { DEFAULT_ME, DEMO_MEMBERS, ROOM_DATA } from "@/lib/workspace";

let seedPromise: Promise<void> | undefined;
export function seedWorkspace() {
  if (!seedPromise) seedPromise = seed().catch(error => { seedPromise = undefined; throw error; });
  return seedPromise;
}
async function seed() {
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
