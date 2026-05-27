import { Router } from "express";
import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import {
  paginationSchema,
  createAppointmentSchema,
  updateAppointmentSchema,
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
    const from = (req.query.from as string | undefined)?.trim();
    const to = (req.query.to as string | undefined)?.trim();
    const status = (req.query.status as string | undefined)?.trim();
    const jobId = (req.query.job_id as string | undefined)?.trim();

    const conditions = [] as any[];
    if (from) conditions.push(gte(schema.appointments.scheduled_at, new Date(from)));
    if (to) conditions.push(lte(schema.appointments.scheduled_at, new Date(to)));
    if (status) conditions.push(eq(schema.appointments.status, status));
    if (jobId) conditions.push(eq(schema.appointments.job_id, jobId));
    const where = conditions.length ? and(...conditions) : undefined;

    const order =
      (req.query.order as string | undefined) === "asc"
        ? asc(schema.appointments.scheduled_at)
        : desc(schema.appointments.scheduled_at);

    const [items, [{ count }]] = await Promise.all([
      db
        .select()
        .from(schema.appointments)
        .where(where)
        .orderBy(order)
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(schema.appointments).where(where),
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
      .from(schema.appointments)
      .where(eq(schema.appointments.id, String(req.params.id)))
      .limit(1);
    if (!item) throw NotFound();
    res.json(item);
  } catch (e) {
    next(e);
  }
});

router.post("/", requireAuth, requireRole(...WRITE_ROLES), async (req, res, next) => {
  try {
    const data = createAppointmentSchema.parse(req.body);
    const insertValues: any = {
      ...data,
      scheduled_at: new Date(data.scheduled_at),
      assignee_id: data.assignee_id ?? data.assigned_to ?? null,
    };
    const [item] = await db.insert(schema.appointments).values(insertValues).returning();
    res.status(201).json(item);
  } catch (e) {
    next(e);
  }
});

router.patch("/:id", requireAuth, requireRole(...WRITE_ROLES), async (req, res, next) => {
  try {
    const data = updateAppointmentSchema.parse(req.body);
    const update: any = { ...data, updated_at: new Date() };
    if (data.scheduled_at) update.scheduled_at = new Date(data.scheduled_at);
    if (data.assigned_to && !data.assignee_id) update.assignee_id = data.assigned_to;

    const [item] = await db
      .update(schema.appointments)
      .set(update)
      .where(eq(schema.appointments.id, String(req.params.id)))
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
      .delete(schema.appointments)
      .where(eq(schema.appointments.id, String(req.params.id)))
      .returning();
    if (!result.length) throw NotFound();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
