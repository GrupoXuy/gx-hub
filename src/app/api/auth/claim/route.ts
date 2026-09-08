import { db } from "@/db";
import { users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { fail, publicMember, seedWorkspace, setSession } from "@/lib/server";

export async function POST(request: Request) {
  try {
    await seedWorkspace();
    const body = await request.json();
    const token = typeof body.token === "string" ? body.token.trim() : "";
    if (token.length < 20) return Response.json({ error: "Link de acesso inválido. Confira o link recebido." }, { status: 400 });
    const [member] = await db.select().from(users).where(and(eq(users.accessToken, token), eq(users.isDemo, false))).limit(1);
    if (!member) return Response.json({ error: "Link de acesso inválido ou expirado. Peça um novo link ao administrador." }, { status: 404 });
    await db.update(users).set({ lastSeen: new Date() }).where(eq(users.id, member.id));
    await setSession(member.id);
    return Response.json({ ok: true, me: publicMember({ ...member, lastSeen: new Date() }) });
  } catch (error) { return fail(error); }
}
