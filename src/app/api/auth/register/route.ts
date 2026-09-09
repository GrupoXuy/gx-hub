import { db } from "@/db";
import { users, invitations } from "@/db/schema";
import { and, eq, gt, ilike } from "drizzle-orm";
import { fail, hashPassword, publicMember, randomToken, seedWorkspace, setSession, validColor, validEmail, validPassword, validProfileText } from "@/lib/server";

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
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!validProfileText(name) || !validProfileText(role) || !validProfileText(company)) return Response.json({ error: "Preencha nome, cargo e empresa com 2 a 80 caracteres." }, { status: 400 });
    if (!validEmail(email)) return Response.json({ error: "Informe um email válido." }, { status: 400 });
    if (!validPassword(password)) return Response.json({ error: "A senha precisa ter entre 8 e 200 caracteres." }, { status: 400 });
    if (body.color !== undefined && !validColor(body.color)) return Response.json({ error: "Escolha uma cor válida." }, { status: 400 });
    const [takenName] = await db.select({ id: users.id }).from(users).where(and(eq(users.isDemo, false), eq(users.name, name))).limit(1);
    if (takenName) return Response.json({ error: "Este nome já está cadastrado. Se é você, use a opção Entrar." }, { status: 409 });
    const [takenEmail] = await db.select({ id: users.id }).from(users).where(and(eq(users.isDemo, false), ilike(users.email, email))).limit(1);
    if (takenEmail) return Response.json({ error: "Este email já está cadastrado. Use a opção Entrar." }, { status: 409 });
    const [member] = await db.insert(users).values({
      id: crypto.randomUUID(), name, role, company, avatar: "", color: body.color || "#c7a66e",
      gender: body.gender === "female" ? "female" : body.gender === "male" ? "male" : null,
      roomId: "recepcao", status: "available", x: 61, y: 73, isDemo: false, isAdmin: false,
      canAccessGroupSystem: false, email, passwordHash: await hashPassword(password), accessToken: null, lastSeen: new Date(0),
    }).returning();
    await setSession(member.id);
    return Response.json({ ok: true, me: publicMember(member) }, { status: 201 });
  } catch (error) { return fail(error); }
}
