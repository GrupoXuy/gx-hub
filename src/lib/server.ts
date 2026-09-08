import { cookies } from "next/headers";
import { db } from "@/db";
import { users, rooms, messages, meetings, invitations, signals } from "@/db/schema";
import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { DEFAULT_ME, ROOM_DATA } from "@/lib/workspace";

const DDL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS gx_rooms (id text PRIMARY KEY, name text NOT NULL, description text NOT NULL, kind text NOT NULL, capacity integer NOT NULL DEFAULT 8, color text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS gx_users (id text PRIMARY KEY, name text NOT NULL, role text NOT NULL DEFAULT 'Membro do ecossistema', company text NOT NULL DEFAULT 'Grupo X', avatar text NOT NULL DEFAULT '', color text NOT NULL DEFAULT '#c7a66e', room_id text NOT NULL DEFAULT 'recepcao', status text NOT NULL DEFAULT 'available', x real NOT NULL DEFAULT 61, y real NOT NULL DEFAULT 73, is_demo boolean NOT NULL DEFAULT false, is_admin boolean NOT NULL DEFAULT false, access_token text, hand_raised boolean NOT NULL DEFAULT false, call_room text, mic_enabled boolean NOT NULL DEFAULT false, camera_enabled boolean NOT NULL DEFAULT false, last_seen timestamptz NOT NULL DEFAULT now())`,
  `ALTER TABLE gx_users ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false`,
  `ALTER TABLE gx_users ADD COLUMN IF NOT EXISTS access_token text`,
  `CREATE TABLE IF NOT EXISTS gx_messages (id text PRIMARY KEY, sender_id text NOT NULL REFERENCES gx_users(id), room_id text NOT NULL DEFAULT 'geral', content text NOT NULL, created_at timestamptz NOT NULL DEFAULT now())`,
  `CREATE INDEX IF NOT EXISTS gx_messages_created_at_idx ON gx_messages (created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS gx_meetings (id text PRIMARY KEY, title text NOT NULL, description text NOT NULL DEFAULT '', room_id text NOT NULL REFERENCES gx_rooms(id), starts_at timestamptz NOT NULL, duration integer NOT NULL DEFAULT 30, organizer_id text NOT NULL REFERENCES gx_users(id), created_at timestamptz NOT NULL DEFAULT now())`,
  `CREATE INDEX IF NOT EXISTS gx_meetings_starts_at_idx ON gx_meetings (starts_at)`,
  `CREATE TABLE IF NOT EXISTS gx_signals (id serial PRIMARY KEY, from_id text NOT NULL, to_id text NOT NULL, room_id text NOT NULL, payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now())`,
  `CREATE INDEX IF NOT EXISTS gx_signals_to_id_idx ON gx_signals (to_id, id)`,
  `CREATE TABLE IF NOT EXISTS gx_invitations (id text PRIMARY KEY, created_by text NOT NULL REFERENCES gx_users(id), expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now())`,
];

export function randomToken() {
  return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 8);
}

export function publicMember<T extends { accessToken?: string | null }>(member: T): Omit<T, "accessToken"> {
  const { accessToken: _drop, ...rest } = member;
  return rest;
}

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
  await cleanupDemoData();
  await cleanupTestData();
  await deduplicateHenrique();
  await ensureHenriqueAdmin();
  const missing = await db.select({ id: users.id }).from(users).where(sql`access_token IS NULL`);
  for (const row of missing) {
    await db.update(users).set({ accessToken: randomToken() }).where(eq(users.id, row.id));
  }
}

async function cleanupDemoData() {
  const demoRows = await db.select({ id: users.id }).from(users).where(or(eq(users.isDemo, true), ilike(users.id, "demo-%")));
  const demoIds = demoRows.map(row => row.id);
  const welcomeIds = ["welcome-ana", "welcome-lucas", "welcome-mariana"];
  if (demoIds.length) {
    await db.delete(signals).where(or(inArray(signals.fromId, demoIds), inArray(signals.toId, demoIds)));
    await db.delete(invitations).where(inArray(invitations.createdBy, demoIds));
    await db.delete(messages).where(or(inArray(messages.senderId, demoIds), inArray(messages.id, welcomeIds)));
    await db.delete(meetings).where(or(inArray(meetings.organizerId, demoIds), ilike(meetings.id, "demo-meeting-%")));
    await db.delete(users).where(inArray(users.id, demoIds));
  } else {
    await db.delete(messages).where(inArray(messages.id, welcomeIds));
    await db.delete(meetings).where(ilike(meetings.id, "demo-meeting-%"));
  }
}

async function cleanupTestData() {
  const testRows = await db.select({ id: users.id }).from(users).where(and(ilike(users.name, "teste%"), eq(users.isAdmin, false)));
  const testIds = testRows.map(row => row.id);
  if (testIds.length) {
    await db.delete(signals).where(or(inArray(signals.fromId, testIds), inArray(signals.toId, testIds)));
    await db.delete(invitations).where(inArray(invitations.createdBy, testIds));
    await db.delete(messages).where(inArray(messages.senderId, testIds));
    await db.delete(meetings).where(inArray(meetings.organizerId, testIds));
    await db.delete(users).where(inArray(users.id, testIds));
  }
  await db.delete(messages).where(or(ilike(messages.content, "%quem chegar, de um oi%"), ilike(messages.content, "conectados para construir%")));
  await db.delete(meetings).where(or(eq(meetings.title, "Teste de sala"), ilike(meetings.title, "conex_o de valida%")));
}

async function deduplicateHenrique() {
  const henriques = await db.select().from(users).where(and(eq(users.name, "Henrique Senna"), eq(users.isDemo, false))).orderBy(desc(users.lastSeen), asc(users.id));
  if (henriques.length < 2) return;
  const [keeper, ...dupes] = henriques;
  const dupIds = dupes.map(dup => dup.id);
  await db.update(messages).set({ senderId: keeper.id }).where(inArray(messages.senderId, dupIds));
  await db.update(meetings).set({ organizerId: keeper.id }).where(inArray(meetings.organizerId, dupIds));
  await db.delete(signals).where(or(inArray(signals.fromId, dupIds), inArray(signals.toId, dupIds)));
  await db.delete(invitations).where(inArray(invitations.createdBy, dupIds));
  await db.delete(users).where(inArray(users.id, dupIds));
}

async function ensureHenriqueAdmin() {
  const [existing] = await db.select().from(users).where(and(eq(users.name, "Henrique Senna"), eq(users.isDemo, false))).limit(1);
  if (!existing) {
    await db.insert(users).values({
      id: "henrique-senna", name: "Henrique Senna", role: "Fundador & CEO", company: "Grupo X",
      avatar: DEFAULT_ME.avatar, color: "#c7a66e", roomId: "recepcao", status: "available",
      x: 61, y: 73, isDemo: false, isAdmin: true, accessToken: randomToken(), lastSeen: new Date(0),
    }).onConflictDoNothing();
    return;
  }
  if (!existing.isAdmin || !existing.accessToken) {
    await db.update(users).set({ isAdmin: true, ...(existing.accessToken ? {} : { accessToken: randomToken() }) }).where(eq(users.id, existing.id));
  }
}

export type MemberRow = typeof users.$inferSelect;

export async function getMember(): Promise<MemberRow | null> {
  const jar = await cookies();
  const id = jar.get("gx_session")?.value;
  if (!id) return null;
  const [member] = await db.select().from(users).where(and(eq(users.id, id), eq(users.isDemo, false))).limit(1);
  return member || null;
}

export async function setSession(id: string) {
  const jar = await cookies();
  jar.set("gx_session", id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 90 });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete("gx_session");
}

export function validProfileText(value: unknown, min = 2, max = 80) {
  return typeof value === "string" && value.trim().length >= min && value.trim().length <= max;
}

export function validColor(value: unknown) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}

export function fail(error: unknown, message = "O workspace está temporariamente indisponível. Tente novamente.") {
  console.error("GX workspace:", error);
  return Response.json({ error: message }, { status: 500 });
}
