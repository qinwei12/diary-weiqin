import "dotenv/config";
import { promises as fs } from "node:fs";
import type { Dirent } from "node:fs";
import path from "node:path";
import { count, lt } from "drizzle-orm";
import { db, pool } from "../lib/db";
import { sessions, postImages } from "../lib/schema";
import { UPLOAD_DIRECTORY } from "../lib/image-utils";

const apply = process.argv.includes("--apply");
const now = Date.now();
const GRACE_MS = 24 * 60 * 60 * 1000;

try {
  const [{ value: expiredSessions }] = await db.select({ value: count() }).from(sessions)
    .where(lt(sessions.expiresAt, new Date(now)));
  const images = await db.select({ url: postImages.url }).from(postImages);
  const referenced = new Set(
    images
      .map((image) => path.basename(image.url))
      .filter((name) => name.length > 0),
  );

  let entries: Dirent[] = [];
  try {
    entries = await fs.readdir(UPLOAD_DIRECTORY, { withFileTypes: true });
  } catch {
    // No uploads directory yet.
  }

  const candidates: { file: string; name: string; size: number }[] = [];
  for (const entry of entries) {
    if (!entry.isFile() || entry.name.startsWith(".")) continue;
    if (referenced.has(entry.name)) continue;
    const file = path.join(UPLOAD_DIRECTORY, entry.name);
    const stat = await fs.stat(file).catch(() => null);
    if (!stat) continue;
    if (now - stat.mtimeMs < GRACE_MS) continue;
    candidates.push({ file, name: entry.name, size: stat.size });
  }

  if (apply) {
    await db.delete(sessions).where(lt(sessions.expiresAt, new Date(now)));
    for (const candidate of candidates) {
      await fs.unlink(candidate.file).catch(() => undefined);
    }
  }

  console.log(
    `Expired sessions: ${expiredSessions}${apply ? " deleted" : " (dry run)"}`,
  );
  console.log(
    `Orphan uploads older than 24h: ${candidates.length}${apply ? " deleted" : " (dry run)"}`,
  );
  for (const candidate of candidates.slice(0, 20)) {
    console.log(`  ${candidate.name} (${candidate.size} bytes)`);
  }
  if (!apply) {
    console.log("Run again with --apply to delete these files and sessions.");
  }
} catch (error) {
  console.error("Cleanup failed:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
