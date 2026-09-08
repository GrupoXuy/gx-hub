import { db } from "@/db";
import { invitations } from "@/db/schema";
import { and, eq, gt } from "drizzle-orm";
import { getMember, fail } from "@/lib/server";
export async function POST() {
  try {
    const me = await getMember();
    if (!me) return Response.json({ error: "Entre no escritório para convidar pessoas." }, { status: 401 });
    const [invite] = await db.insert(invitations).values({ createdBy: me.id, expiresAt: new Date(Date.now() + 7 * 86400000) }).returning();
    return Response.json({ token: invite.id, expiresAt: invite.expiresAt });
  } catch (error) { return fail(error); }
}
export async function GET(request: Request) {
  try {
    const token = new URL(request.url).searchParams.get("token") || "";
    const [invite] = await db.select().from(invitations).where(and(eq(invitations.id, token), gt(invitations.expiresAt, new Date()))).limit(1);
    if (!invite) return Response.json({ error: "Este convite expirou ou não existe. Peça um novo link à sua equipe." }, { status: 404 });
    return Response.json({ valid: true, workspace: "Grupo X", expiresAt: invite.expiresAt });
  } catch (error) { return fail(error); }
}
