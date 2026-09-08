import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, latencyMs: Date.now() - started });
  } catch (error) {
    const err = error as { code?: string; message?: string };
    return Response.json(
      {
        ok: false,
        dbConfigured: Boolean(process.env.DATABASE_URL),
        code: err?.code || "unknown",
        hint: err?.message ? String(err.message).slice(0, 160) : "sem detalhes",
      },
      { status: 500 }
    );
  }
}
