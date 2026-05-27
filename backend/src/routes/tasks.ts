import { Router } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import {
  paginationSchema,
  createTaskSchema,
  updateTaskSchema,
} from "../validators/schemas.js";
import { NotFound } from "../utils/errors.js";

const router = Router();

const READ_ROLES = [
  "admin",
  "manager",
  "estimator",
  "office",
  "office_staff",
  "sales_rep",
  "project_lead",
  "project_manager",
  "production_manager",
  "crew_lead",
  "crew",
];
const WRITE_ROLES = [
  "admin",
  "manager",
  "estimator",
  "office",
  "office_staff",
  "sales_rep",
  "project_lead",
  "project_manager",
  "production_manager",
];

router.get("/", requireAuth, requireRole(...READ_ROLES), async (req, res, next) => {
  try {
    const { limit, offset } = paginationSchema.parse(req.query);
    const status = (req.query.status as string | undefined)?.trim();
    const jobId = (req.query.job_id as string | undefined)?.trim();
    const assigneeId = (req.query.assigned_to as string | undefined)?.trim();

    const conditions = [] as any[];
    if (status) conditions.push(eq(schema.tasks.status, status));
    if (jobId) conditions.push(eq(schema.tasks.job_id, jobId));
    if (assigneeId) conditions.push(eq(schema.tasks.assignee_id, assigneeId));
    const where = conditions.length ? and(...conditions) : undefined;

    const [items, [{ count }]] = await Promise.all([
      db
        .select()
        .from(schema.tasks)
        .where(where)
        .orderBy(desc(schema.tasks.created_at))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(schema.tasks).where(where),
    ]);
    res.json({ items, total: count, limit, offset });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", requireAuth, requireRole(...READ_ROLES), async (req, res, next) => {
  try {
    const [item] = await db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.id, String(req.params.id)))
      .limit(1);
    if (!item) throw NotFound();
    res.json(item);
  } catch (e) {
    next(e);
  }
});

router.post("/", requireAuth, requireRole(...WRITE_ROLES), async (req, res, next) => {
  try {
    const data = createTaskSchema.parse(req.body);
    const insertValues: any = {
      ...data,
      due_date: data.due_date ? new Date(data.due_date) : null,
      // Mirror assigned_to → assignee_id for FE consistency
      assignee_id: data.assignee_id ?? data.assigned_to ?? null,
    };
    const [item] = await db.insert(schema.tasks).values(insertValues).returning();
    res.status(201).json(item);
  } catch (e) {
    next(e);
  }
});

router.patch("/:id", requireAuth, requireRole(...WRITE_ROLES), async (req, res, next) => {
  try {
    const data = updateTaskSchema.parse(req.body);
    const update: any = { ...data, updated_at: new Date() };
    if (data.due_date) update.due_date = new Date(data.due_date);
    if (data.completed_date) update.completed_date = new Date(data.completed_date);
    if (data.status === "completed" && !update.completed_at) update.completed_at = new Date();
    if (data.assigned_to && !data.assignee_id) update.assignee_id = data.assigned_to;

    const [item] = await db
      .update(schema.tasks)
      .set(update)
      .where(eq(schema.tasks.id, String(req.params.id)))
      .returning();
    if (!item) throw NotFound();
    res.json(item);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const result = await db
      .delete(schema.tasks)
      .where(eq(schema.tasks.id, String(req.params.id)))
      .returning();
    if (!result.length) throw NotFound();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
