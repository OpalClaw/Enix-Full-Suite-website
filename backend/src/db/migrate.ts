// =============================================================================
// Migration runner
// =============================================================================
// Runs drizzle-kit-generated migrations (if a `meta` folder exists) AND any
// hand-written SQL files in src/db/migrations/ in lexicographic order.
// Each applied migration is recorded in a `schema_migrations` table for
// idempotency.

import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate as drizzleMigrate } from "drizzle-orm/node-postgres/migrator";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { logger } from "../utils/logger.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__dirname, "migrations");

const pool = new pg.Pool({ connectionString });
const db = drizzle(pool);

async function ensureTracker(client: pg.PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename    text PRIMARY KEY,
      applied_at  timestamptz NOT NULL DEFAULT now()
    )
  `);
}

async function appliedSet(client: pg.PoolClient): Promise<Set<string>> {
  const { rows } = await client.query<{ filename: string }>(
    "SELECT filename FROM schema_migrations",
  );
  return new Set(rows.map((r) => r.filename));
}

async function listSqlFiles(): Promise<string[]> {
  try {
    const all = await fs.readdir(MIGRATIONS_DIR);
    return all.filter((f) => f.endsWith(".sql")).sort((a, b) => a.localeCompare(b));
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function loadDrizzleJournalTags(): Promise<Set<string>> {
  try {
    const raw = await fs.readFile(path.join(MIGRATIONS_DIR, "meta", "_journal.json"), "utf8");
    const parsed = JSON.parse(raw) as { entries?: { tag?: string }[] };
    const tags = (parsed.entries ?? [])
      .map((e) => e.tag)
      .filter((t): t is string => typeof t === "string");
    return new Set(tags);
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return new Set();
    throw err;
  }
}

async function runRawSqlMigrations(): Promise<void> {
  const files = await listSqlFiles();
  if (files.length === 0) return;
  const drizzleTags = await loadDrizzleJournalTags();
  const client = await pool.connect();
  try {
    await ensureTracker(client);
    const applied = await appliedSet(client);
    for (const file of files) {
      const baseTag = file.replace(/\.sql$/, "");
      if (applied.has(file) || drizzleTags.has(baseTag)) {
        logger.info({ file }, "migration already applied (via drizzle journal or raw tracker)");
        continue;
      }
      const sql = await fs.readFile(path.join(MIGRATIONS_DIR, file), "utf8");
      logger.info({ file }, "applying migration");
      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [file]);
        await client.query("COMMIT");
        logger.info({ file }, "migration applied");
      } catch (e) {
        await client.query("ROLLBACK");
        logger.error({ file, err: e }, "migration failed");
        throw e;
      }
    }
  } finally {
    client.release();
  }
}

async function main(): Promise<void> {
  logger.info("running drizzle-kit migrations (if present)");
  // drizzle-kit looks for a `meta/_journal.json` — silently skip if absent.
  try {
    await drizzleMigrate(db, { migrationsFolder: MIGRATIONS_DIR });
  } catch (e) {
    const err = e as Error & { code?: string };
    if (err.code !== "ENOENT" && !err.message?.includes("_journal")) {
      throw e;
    }
    logger.info("no drizzle-kit journal found; skipping");
  }

  logger.info("running raw-SQL migrations");
  await runRawSqlMigrations();

  logger.info("migrations complete");
  await pool.end();
}

main().catch((e) => {
  logger.error({ err: e }, "migrate failed");
  pool.end().finally(() => process.exit(1));
});
