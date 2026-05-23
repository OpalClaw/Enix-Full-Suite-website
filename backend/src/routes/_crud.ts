import { Router } from "express";
import { eq, desc, sql } from "drizzle-orm";
import type { PgTable, PgColumn } from "drizzle-orm/pg-core";
import { db } from "../db/index.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { paginationSchema } from "../validators/schemas.js";
import { NotFound } from "../utils/errors.js";
import { z } from "zod";

interface CrudOpts<T extends PgTable> {
  table: T;
  pkColumn: PgColumn;
  createSchema: z.ZodTypeAny;
  updateSchema: z.ZodTypeAny;
  readRoles?: string[];
  writeRoles?: string[];
  // Optional ordering column (defaults to created_at desc if available)
  orderByColumn?: PgColumn;
}

export function buildCrud<T extends PgTable>(opts: CrudOpts<T>): Router {
  const router = Router();
  const read = opts.readRoles ?? ["admin", "manager", "office", "estimator"];
  const write = opts.writeRoles ?? ["admin", "manager"];

  router.get("/", requireAuth, requireRole(...read), async (req, res, next) => {
    try {
      const { limit, offset } = paginationSchema.parse(req.query);
      const order = opts.orderByColumn ? desc(opts.orderByColumn) : undefined;
      const [items, [{ count }]] = await Promise.all([
        db.select().from(opts.table as any).orderBy(order as any).limit(limit).offset(offset),
        db.select({ count: sql<number>`count(*)::int` }).from(opts.table as any),
      ]);
      res.json({ items, total: count, limit, offset });
    } catch (e) { next(e); }
  });

  router.get("/:id", requireAuth, requireRole(...read), async (req, res, next) => {
    try {
      const [item] = await db.select().from(opts.table as any).where(eq(opts.pkColumn, String(req.params.id))).limit(1);
      if (!item) throw NotFound();
      res.json(item);
    } catch (e) { next(e); }
  });

  router.post("/", requireAuth, requireRole(...write), async (req, res, next) => {
    try {
      const data = opts.createSchema.parse(req.body);
      const inserted = (await db.insert(opts.table as any).values(data as any).returning()) as any[];
      const [item] = inserted;
      res.status(201).json(item);
    } catch (e) { next(e); }
  });

  router.patch("/:id", requireAuth, requireRole(...write), async (req, res, next) => {
    try {
      const data = opts.updateSchema.parse(req.body);
      const [item] = await db.update(opts.table as any).set({ ...data, updated_at: new Date() } as any)
        .where(eq(opts.pkColumn, String(req.params.id))).returning();
      if (!item) throw NotFound();
      res.json(item);
    } catch (e) { next(e); }
  });

  router.delete("/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
    try {
      const result = (await db.delete(opts.table as any).where(eq(opts.pkColumn, String(req.params.id))).returning()) as any[];
      if (!result.length) throw NotFound();
      res.json({ ok: true });
    } catch (e) { next(e); }
  });

  return router;
}
