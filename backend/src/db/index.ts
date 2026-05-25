import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

function shouldUseSsl(url: string): false | { rejectUnauthorized: boolean } {
  if (process.env.PGSSLMODE === "disable") return false;
  const isLocal =
    url.includes("localhost") ||
    url.includes("127.0.0.1") ||
    url.includes("?host=/") ||
    url.includes("&host=/");
  if (isLocal) return false;
  if (process.env.NODE_ENV === "production") return { rejectUnauthorized: false };
  return false;
}

export const pool = new pg.Pool({
  connectionString,
  max: Number(process.env.DB_POOL_MAX || 20),
  idleTimeoutMillis: 30_000,
  ssl: shouldUseSsl(connectionString),
});

pool.on("error", (err) => {
  // eslint-disable-next-line no-console
  console.error("[pg] unexpected pool error:", err);
});

export const db = drizzle(pool, { schema });
export { schema };
