import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import { logger } from "../utils/logger.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const pool = new pg.Pool({ connectionString });
const db = drizzle(pool);

logger.info("running migrations");
await migrate(db, { migrationsFolder: "./src/db/migrations" });
logger.info("migrations complete");
await pool.end();
