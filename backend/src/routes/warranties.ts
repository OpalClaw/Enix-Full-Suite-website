import { Router } from "express";
import { desc, eq, sql } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import {
  paginationSchema,
  createWarrantySchema,
  updateWarrantySchema,
} from "../validators/schemas.js";
import { NotFound } from "../utils/errors.js";

const router = Router();

const READ = ["admin", "manager", "estimator", "office", "office_staff", "project_manager", "production_manager", "crew_lead", "crew", "client"];
const WRITE = ["admin", "manager", "office", "office_staff", "project_manager", "production_manager"];

router.get("/", requireAuth, requireRole(...READ), async (req, res, next) => {
  try {
    const { limit, offset } = paginationSchema.parse(req.query);
    const [items, [{ count }]] = await Promise.all([
      db.select().from(schema.warranties).orderBy(desc(schema.warranties.created_at)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(schema.warranties),
    ]);
    res.json({ items, total: count, limit, offset });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", requireAuth, requireRole(...READ), async (req, res, next) => {
  try {
    const [item] = await db
      .select()
      .from(schema.warranties)
      .where(eq(schema.warranties.id, String(req.params.id)))
      .limit(1);
    if (!item) throw NotFound();
    res.json(item);
  } catch (e) {
    next(e);
  }
});

router.post("/", requireAuth, requireRole(...WRITE), async (req, res, next) => {
  try {
    const data = createWarrantySchema.parse(req.body);
    const [item] = await db
      .insert(schema.warranties)
      .values({
        ...data,
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date),
      } as any)
      .returning();
    res.status(201).json(item);
  } catch (e) {
    next(e);
  }
});

router.patch("/:id", requireAuth, requireRole(...WRITE), async (req, res, next) => {
  try {
    const data = updateWarrantySchema.parse(req.body);
    const update: any = { ...data, updated_at: new Date() };
    if (data.start_date) update.start_date = new Date(data.start_date);
    if (data.end_date) update.end_date = new Date(data.end_date);
    const [item] = await db
      .update(schema.warranties)
      .set(update)
      .where(eq(schema.warranties.id, String(req.params.id)))
      .returning();
    if (!item) throw NotFound();
    res.json(item);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const result = await db.delete(schema.warranties).where(eq(schema.warranties.id, String(req.params.id))).returning();
    if (!result.length) throw NotFound();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
