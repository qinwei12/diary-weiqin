import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export function createDatabase(connectionString: string) {
  const pool = new Pool({
    connectionString,
    max: 3,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 20_000,
    enableChannelBinding: true,
  });
  pool.on("error", (error) => console.error("Idle database connection failed:", error.message));
  return { db: drizzle({ client: pool, schema }), pool };
}

const globalForDatabase = globalThis as unknown as {
  diaryDatabase?: ReturnType<typeof createDatabase>;
};

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not configured. Add the Neon connection string to .env.");
}

const database = globalForDatabase.diaryDatabase ?? createDatabase(connectionString);
export const { db, pool } = database;

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.diaryDatabase = database;
}
