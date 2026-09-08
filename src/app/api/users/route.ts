import { db } from "@/db";
import { users, messages, meetings, invitations, signals } from "@/db/schema";
import { and, asc, eq, inArray, or } from "drizzle-orm";
import { fail, getMember, randomToken, validColor, validProfileText } from "@/lib/server";
export const dynamic = "force-dynamic";

async function adminCount(exceptId?: string) {
  const rows = await db.select({ id: users.id }).from(users).where(and(eq(users.isDemo, false), eq(users.isAdmin, true)));
  return rows.filter(row => row.id !== exceptId).length;
}

export async function GET() {
  try {
    const me = await getMember();
    if (!me) return Response.json({ error: "Entre no escritório para ver a equipe." }, { status: 401 });
    const team = await db.select().from(users).where(eq(users.isDemo, false)).orderBy(asc(users.name));
    if (me.isAdmin) {
      return Response.json({ team: team.map(({ passwordHash: _dropHash, email: _dropEmail, ...rest }) => rest) });
    }
    return Response.json({ team: team.map(({ accessToken: _dropToken, passwordHash: _dropHash, email: _dropEmail, ...rest }) => rest) });
  } catch (error) { return fail(error); }
}

export async function POST(request: Request) {
  try {
    const me = await getMember();
    if (!me) return Response.json({ error: "Entre no escritório para continuar." }, { status: 401 });
    const body = await request.json();
    if (body.action === "regenerate") {
      const targetId = String(body.id || me.id);
      if (targetId !== me.id && !me.isAdmin) return Response.json({ error: "Apenas administradores podem gerenciar outros usuários." }, { status: 403 });
      const [target] = await db.select().from(users).where(and(eq(users.id, targetId), eq(users.isDemo, false))).limit(1);
      if (!target) return Response.json({ error: "Usuário não encontrado." }, { status: 404 });
      const accessToken = randomToken();
      await db.update(users).set({ accessToken }).where(eq(users.id, targetId));
      return Response.json({ ok: true, id: targetId, accessToken });
    }
    if (!me.isAdmin) return Response.json({ error: "Apenas administradores podem cadastrar usuários." }, { status: 403 });
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const role = typeof body.role === "string" ? body.role.trim() : "";
    const company = typeof body.company === "string" ? body.company.trim() : "";
    if (!validProfileText(name) || !validProfileText(role) || !validProfileText(company)) {
      return Response.json({ error: "Preencha nome, cargo e empresa com 2 a 80 caracteres." }, { status: 400 });
    }
    if (body.color !== undefined && !validColor(body.color)) return Response.json({ error: "Escolha uma cor válida." }, { status: 400 });
    const [taken] = await db.select({ id: users.id }).from(users).where(and(eq(users.isDemo, false), eq(users.name, name))).limit(1);
    if (taken) return Response.json({ error: "Este nome já está cadastrado na equipe." }, { status: 409 });
    const [member] = await db.insert(users).values({
      id: crypto.randomUUID(), name, role, company, avatar: "", color: body.color || "#c7a66e",
      roomId: "recepcao", status: "available", x: 61, y: 73,
      isDemo: false, isAdmin: body.isAdmin === true, accessToken: randomToken(), lastSeen: new Date(0),
    }).returning();
    return Response.json({ member }, { status: 201 });
  } catch (error) { return fail(error); }
}

export async function PATCH(request: Request) {
  try {
    const me = await getMember();
    if (!me) return Response.json({ error: "Entre no escritório para continuar." }, { status: 401 });
    if (!me.isAdmin) return Response.json({ error: "Apenas administradores podem editar usuários." }, { status: 403 });
    const body = await request.json();
    const targetId = String(body.id || "");
    const [target] = await db.select().from(users).where(and(eq(users.id, targetId), eq(users.isDemo, false))).limit(1);
    if (!target) return Response.json({ error: "Usuário não encontrado." }, { status: 404 });
    const patch: Partial<typeof users.$inferInsert> = {};
    for (const field of ["name", "role", "company"] as const) {
      if (body[field] !== undefined) {
        if (!validProfileText(body[field])) return Response.json({ error: "Preencha nome, cargo e empresa com 2 a 80 caracteres." }, { status: 400 });
        patch[field] = (body[field] as string).trim();
      }
    }
    if (patch.name && patch.name !== target.name) {
      const [taken] = await db.select({ id: users.id }).from(users).where(and(eq(users.isDemo, false), eq(users.name, patch.name))).limit(1);
      if (taken) return Response.json({ error: "Este nome já está cadastrado na equipe." }, { status: 409 });
    }
    if (body.color !== undefined) {
      if (!validColor(body.color)) return Response.json({ error: "Escolha uma cor válida." }, { status: 400 });
      patch.color = body.color;
    }
    if (typeof body.isAdmin === "boolean" && body.isAdmin !== target.isAdmin) {
      if (!body.isAdmin && target.id === me.id) return Response.json({ error: "Você não pode remover seu próprio acesso de administrador." }, { status: 400 });
      if (!body.isAdmin && (await adminCount(target.id)) === 0) return Response.json({ error: "A equipe precisa de ao menos um administrador." }, { status: 400 });
      patch.isAdmin = body.isAdmin;
    }
    const [updated] = await db.update(users).set(patch).where(eq(users.id, targetId)).returning();
    return Response.json({ member: updated });
  } catch (error) { return fail(error); }
}

export async function DELETE(request: Request) {
  try {
    const me = await getMember();
    if (!me) return Response.json({ error: "Entre no escritório para continuar." }, { status: 401 });
    if (!me.isAdmin) return Response.json({ error: "Apenas administradores podem remover usuários." }, { status: 403 });
    const id = new URL(request.url).searchParams.get("id") || "";
    const [target] = await db.select().from(users).where(and(eq(users.id, id), eq(users.isDemo, false))).limit(1);
    if (!target) return Response.json({ error: "Usuário não encontrado." }, { status: 404 });
    if (target.id === me.id) return Response.json({ error: "Você não pode remover seu próprio usuário." }, { status: 400 });
    if (target.isAdmin && (await adminCount(target.id)) === 0) return Response.json({ error: "A equipe precisa de ao menos um administrador." }, { status: 400 });
    await db.transaction(async tx => {
      await tx.delete(signals).where(or(eq(signals.fromId, id), eq(signals.toId, id)));
      await tx.delete(invitations).where(eq(invitations.createdBy, id));
      await tx.delete(messages).where(eq(messages.senderId, id));
      await tx.delete(meetings).where(eq(meetings.organizerId, id));
      await tx.delete(users).where(eq(users.id, id));
    });
    return Response.json({ ok: true });
  } catch (error) { return fail(error); }
}
