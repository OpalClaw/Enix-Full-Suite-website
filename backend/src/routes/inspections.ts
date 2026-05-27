import { Router } from "express";
import { desc, eq, sql } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import {
  paginationSchema,
  createInspectionSchema,
  updateInspectionSchema,
} from "../validators/schemas.js";
import { NotFound } from "../utils/errors.js";

const router = Router();

const READ = ["admin", "manager", "estimator", "office", "office_staff", "sales_rep", "project_manager", "production_manager", "crew_lead", "crew"];
const WRITE = ["admin", "manager", "estimator", "office", "office_staff", "sales_rep", "project_manager", "production_manager"];

router.get("/", requireAuth, requireRole(...READ), async (req, res, next) => {
  try {
    const { limit, offset } = paginationSchema.parse(req.query);
    const [items, [{ count }]] = await Promise.all([
      db.select().from(schema.inspections).orderBy(desc(schema.inspections.created_at)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(schema.inspections),
    ]);
    res.json({ items, total: count, limit, offset });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", requireAuth, requireRole(...READ), async (req, res, next) => {
  try {
    const [item] = await db.select().from(schema.inspections).where(eq(schema.inspections.id, String(req.params.id))).limit(1);
    if (!item) throw NotFound();
    res.json(item);
  } catch (e) {
    next(e);
  }
});

router.post("/", requireAuth, requireRole(...WRITE), async (req, res, next) => {
  try {
    const data = createInspectionSchema.parse(req.body);
    const insertValues: any = { ...data };
    if (data.inspection_date) insertValues.inspection_date = new Date(data.inspection_date);
    if (data.scheduled_at) insertValues.scheduled_at = new Date(data.scheduled_at);
    if (!data.inspector_id && req.user) insertValues.inspector_id = req.user.sub;
    const [item] = await db.insert(schema.inspections).values(insertValues).returning();
    res.status(201).json(item);
  } catch (e) {
    next(e);
  }
});

router.patch("/:id", requireAuth, requireRole(...WRITE), async (req, res, next) => {
  try {
    const data = updateInspectionSchema.parse(req.body);
    const update: any = { ...data, updated_at: new Date() };
    if (data.inspection_date) update.inspection_date = new Date(data.inspection_date);
    if (data.scheduled_at) update.scheduled_at = new Date(data.scheduled_at);
    const [item] = await db
      .update(schema.inspections)
      .set(update)
      .where(eq(schema.inspections.id, String(req.params.id)))
      .returning();
    if (!item) throw NotFound();
    res.json(item);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const result = await db.delete(schema.inspections).where(eq(schema.inspections.id, String(req.params.id))).returning();
    if (!result.length) throw NotFound();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
