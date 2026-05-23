import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

export const pool = new pg.Pool({
  connectionString,
  max: Number(process.env.DB_POOL_MAX || 20),
  idleTimeoutMillis: 30_000,
  ssl: process.env.NODE_ENV === "production" && !connectionString.includes("localhost")
    ? { rejectUnauthorized: false }
    : undefined,
});

pool.on("error", (err) => {
  // eslint-disable-next-line no-console
  console.error("[pg] unexpected pool error:", err);
});

export const db = drizzle(pool, { schema });
export { schema };
