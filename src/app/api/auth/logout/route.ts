import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { clearSession, fail, getMember } from "@/lib/server";

export async function POST() {
  try {
    const me = await getMember();
    if (me) {
      await db.update(users).set({ callRoom: null, micEnabled: false, cameraEnabled: false, status: "away", lastSeen: new Date() }).where(eq(users.id, me.id));
    }
    await clearSession();
    return Response.json({ ok: true });
  } catch (error) { return fail(error); }
}
