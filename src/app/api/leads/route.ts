import { db } from "@/db";
import { leads, meetings } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { fail, getMember, isHenriqueAdmin } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const me = await getMember();
    if (!me || !isHenriqueAdmin(me)) return Response.json({ error: "Apenas Henrique Senna pode visualizar os leads." }, { status: 403 });
    const result = await db.select({ lead: leads, meeting: meetings }).from(leads).leftJoin(meetings, eq(leads.meetingId, meetings.id)).orderBy(desc(leads.createdAt));
    return Response.json({ leads: result.map(row => ({ ...row.lead, meetingTitle: row.meeting?.title || "Reunião" })) });
  } catch (error) { return fail(error); }
}
