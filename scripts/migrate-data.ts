import "dotenv/config";
import { config } from "dotenv";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { createDatabase, pool } from "../lib/db";
import { posts, postImages, users, sessions } from "../lib/schema";

// .env.migration is ignored by Git. Neither connection string is logged.
config({ path: ".env.migration", quiet: true });

type Database = ReturnType<typeof createDatabase>["db"];
type Snapshot = {
  posts: (typeof posts.$inferSelect)[];
  images: (typeof postImages.$inferSelect)[];
  users: (typeof users.$inferSelect)[];
  sessions: (typeof sessions.$inferSelect)[];
};

async function snapshot(database: Database): Promise<Snapshot> {
  return database.transaction(async (tx) => ({
    posts: await tx.select().from(posts).orderBy(posts.id),
    images: await tx.select().from(postImages).orderBy(postImages.id),
    users: await tx.select().from(users).orderBy(users.id),
    sessions: await tx.select().from(sessions).orderBy(sessions.id),
  }), { isolationLevel: "repeatable read", accessMode: "read only" });
}

function digest(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function assertEqual(expected: Snapshot, actual: Snapshot) {
  for (const key of ["posts", "images", "users", "sessions"] as const) {
    if (digest(expected[key]) !== digest(actual[key])) {
      throw new Error(`Full-row verification failed for ${key}.`);
    }
  }
}

const sourceUrl = process.env.SOURCE_DATABASE_URL ?? process.env.DATABASE_URL;
const targetUrl = process.env.TARGET_DATABASE_URL;
if (!sourceUrl || !targetUrl) throw new Error("Set SOURCE_DATABASE_URL (or DATABASE_URL) and TARGET_DATABASE_URL.");
const sourceAddress = new URL(sourceUrl);
const targetAddress = new URL(targetUrl);
if (sourceAddress.hostname === targetAddress.hostname && sourceAddress.pathname === targetAddress.pathname) {
  throw new Error("Source and target must be different databases.");
}

const source = createDatabase(sourceUrl);
const target = createDatabase(targetUrl);
try {
  const original = await snapshot(source.db);
  const backupDirectory = resolve("data/database-backups");
  await mkdir(backupDirectory, { recursive: true, mode: 0o700 });
  const backupPath = resolve(backupDirectory, `${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  await writeFile(backupPath, JSON.stringify(original, null, 2), { flag: "wx", mode: 0o600 });
  console.log(`Private snapshot saved: ${backupPath}`);

  await migrate(target.db, { migrationsFolder: resolve("drizzle") });
  await target.db.transaction(async (tx) => {
    // Prevent concurrent writes while checking emptiness and copying the snapshot.
    await tx.execute('LOCK TABLE "Post", "PostImage", "User", "Session" IN EXCLUSIVE MODE');
    const current = {
      posts: await tx.select().from(posts).orderBy(posts.id),
      images: await tx.select().from(postImages).orderBy(postImages.id),
      users: await tx.select().from(users).orderBy(users.id),
      sessions: await tx.select().from(sessions).orderBy(sessions.id),
    };
    if (Object.values(current).some(rows => rows.length > 0)) {
      assertEqual(original, current);
      console.log("Target already contains the identical snapshot; import skipped.");
      return;
    }
    // Do not overwrite or truncate an existing target. Import is one transaction.
    if (original.users.length) await tx.insert(users).values(original.users);
    if (original.posts.length) await tx.insert(posts).values(original.posts);
    if (original.images.length) await tx.insert(postImages).values(original.images);
    if (original.sessions.length) await tx.insert(sessions).values(original.sessions);
    assertEqual(original, {
      posts: await tx.select().from(posts).orderBy(posts.id),
      images: await tx.select().from(postImages).orderBy(postImages.id),
      users: await tx.select().from(users).orderBy(users.id),
      sessions: await tx.select().from(sessions).orderBy(sessions.id),
    });
  });
  assertEqual(original, await snapshot(target.db));
  // Catch source writes during migration rather than silently cutting over stale data.
  assertEqual(original, await snapshot(source.db));
  console.log("Migration verified: every field, ID, timestamp, password hash and session hash matches.");
  console.log(JSON.stringify(Object.fromEntries(Object.entries(original).map(([key, rows]) => [key, rows.length]))));
} catch (error) {
  // Drizzle errors include bound values; never print them for account/session imports.
  console.error("Migration failed:", error instanceof Error ? error.message.split("\n")[0] : "Unknown error");
  process.exitCode = 1;
} finally {
  await Promise.all([source.pool.end(), target.pool.end(), pool.end()]);
}
