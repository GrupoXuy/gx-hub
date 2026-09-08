import { db } from "@/db";
import { users, invitations } from "@/db/schema";
import { and, eq, gt } from "drizzle-orm";
import { fail, publicMember, randomToken, seedWorkspace, setSession, validColor, validProfileText } from "@/lib/server";

export async function POST(request: Request) {
  try {
    await seedWorkspace();
    const body = await request.json();
    const inviteToken = typeof body.inviteToken === "string" ? body.inviteToken.trim() : "";
    if (!inviteToken) return Response.json({ error: "É necessário um convite válido para se cadastrar. Peça o link ao administrador." }, { status: 403 });
    const [invite] = await db.select().from(invitations).where(and(eq(invitations.id, inviteToken), gt(invitations.expiresAt, new Date()))).limit(1);
    if (!invite) return Response.json({ error: "Este convite expirou ou não existe. Peça um novo link ao administrador." }, { status: 403 });
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const role = typeof body.role === "string" ? body.role.trim() : "";
    const company = typeof body.company === "string" ? body.company.trim() : "";
    if (!validProfileText(name) || !validProfileText(role) || !validProfileText(company)) {
      return Response.json({ error: "Preencha nome, cargo e empresa com 2 a 80 caracteres." }, { status: 400 });
    }
    if (body.color !== undefined && !validColor(body.color)) return Response.json({ error: "Escolha uma cor válida." }, { status: 400 });
    const [taken] = await db.select({ id: users.id }).from(users).where(and(eq(users.isDemo, false), eq(users.name, name))).limit(1);
    if (taken) return Response.json({ error: "Este nome já está cadastrado. Se é você, use a opção Entrar." }, { status: 409 });
    const [member] = await db.insert(users).values({
      id: crypto.randomUUID(), name, role, company, avatar: "", color: body.color || "#c7a66e",
      roomId: "recepcao", status: "available", x: 61, y: 73,
      isDemo: false, isAdmin: false, accessToken: randomToken(), lastSeen: new Date(),
    }).returning();
    await setSession(member.id);
    return Response.json({ ok: true, me: publicMember(member) }, { status: 201 });
  } catch (error) { return fail(error); }
}
