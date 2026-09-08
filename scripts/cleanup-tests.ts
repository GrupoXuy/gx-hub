import "dotenv/config";
import { db, pool } from "@/db";
import { users, messages, meetings, invitations, signals } from "@/db/schema";
import { inArray, or } from "drizzle-orm";
import { existsSync, readFileSync } from "node:fs";
async function main() {
  if (!existsSync("artifacts/test-users.json")) return;
  const ids = (JSON.parse(readFileSync("artifacts/test-users.json", "utf8")) as string[]).filter(id => id !== "henrique-senna");
  if (!ids.length) return;
  if (ids.some(id => !/^[a-f0-9-]{36}$/.test(id))) throw new Error("Invalid test user ID");
  await db.transaction(async tx => {
    await tx.delete(signals).where(or(inArray(signals.fromId, ids), inArray(signals.toId, ids)));
    await tx.delete(invitations).where(inArray(invitations.createdBy, ids));
    await tx.delete(meetings).where(inArray(meetings.organizerId, ids));
    await tx.delete(messages).where(inArray(messages.senderId, ids));
    await tx.delete(users).where(inArray(users.id, ids));
  });
  console.log(`Removed ${ids.length} isolated test sessions and their data.`);
}
main().then(() => pool.end()).catch(async error => { console.error(error); await pool.end(); process.exitCode = 1; });
