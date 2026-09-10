import { db } from "@/db";
import { clientInvites, signals, users } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { clearGuestSession, fail } from "@/lib/server";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = typeof body.token === "string" ? body.token : "";
    const jarId = (await import("next/headers")).cookies;
    const jar = await jarId();
    const guestId = jar.get("gx_guest_session")?.value;
    if (guestId) {
      await db.update(users).set({ guestExpiresAt: new Date(), callRoom: null, micEnabled: false, cameraEnabled: false }).where(eq(users.id, guestId));
      await db.delete(signals).where(or(eq(signals.fromId, guestId), eq(signals.toId, guestId)));
    }
    if (token) await db.update(clientInvites).set({ usedAt: new Date() }).where(eq(clientInvites.id, token));
    await clearGuestSession();
    return Response.json({ ok: true });
  } catch (error) { return fail(error); }
}
