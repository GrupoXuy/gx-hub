import { db } from "@/db";
import { users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { fail, publicMember, seedWorkspace, setSession } from "@/lib/server";

export async function POST(request: Request) {
  try {
    await seedWorkspace();
    const body = await request.json();
    const userId = typeof body.userId === "string" ? body.userId : "";
    if (!userId) return Response.json({ error: "Escolha quem é você para entrar." }, { status: 400 });
    const [member] = await db.select().from(users).where(and(eq(users.id, userId), eq(users.isDemo, false))).limit(1);
    if (!member) return Response.json({ error: "Usuário não encontrado. Verifique com o administrador." }, { status: 404 });
    await db.update(users).set({ lastSeen: new Date(), status: member.status === "away" ? "available" : member.status }).where(eq(users.id, member.id));
    await setSession(member.id);
    return Response.json({ ok: true, me: publicMember({ ...member, lastSeen: new Date() }) });
  } catch (error) { return fail(error); }
}
