import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, pool } from "../lib/db";
import { users, sessions } from "../lib/schema";
import { hashPassword } from "../lib/password";

const username = (process.env.OWNER_USERNAME?.trim() || "qinwei").toLowerCase();
const password =
  process.env.NEW_PASSWORD || process.argv.slice(2).join(" ").trim();

if (!password || password.length < 6) {
  console.error(
    "Usage: NEW_PASSWORD='at-least-6-chars' bun run db:reset-password",
  );
  process.exit(1);
}

try {
  const user = await db.query.users.findFirst({ where: eq(users.username, username) });
  if (!user) {
    console.error(`Owner @${username} does not exist. Run db:seed first.`);
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  await db.transaction(async (tx) => {
    await tx.update(users).set({ passwordHash, mustChangePassword: true }).where(eq(users.id, user.id));
    await tx.delete(sessions).where(eq(sessions.userId, user.id));
  });

  console.log(
    `Password reset for @${username}; every existing session was signed out.`,
  );
} catch (error) {
  console.error("Password reset failed:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
