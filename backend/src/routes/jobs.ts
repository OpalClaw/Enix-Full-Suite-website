import { Router } from "express";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { createJobSchema, updateJobSchema, paginationSchema } from "../validators/schemas.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { NotFound, Forbidden, Conflict, BadRequest } from "../utils/errors.js";

const router = Router();

function generateJobNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `${year}-${rand}`;
}

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { limit, offset } = paginationSchema.parse(req.query);
    const q = (req.query.q as string | undefined)?.trim();
    const status = req.query.status as string | undefined;

    // Clients can only see their own job
    const conditions = [];
    if (req.user!.role === "client") {
      conditions.push(eq(schema.jobs.customer_email, req.user!.email));
    }
    if (status) conditions.push(eq(schema.jobs.status, status as any));
    if (q) conditions.push(or(
      ilike(schema.jobs.job_number, `%${q}%`),
      ilike(schema.jobs.customer_name, `%${q}%`),
    ));

    const where = conditions.length ? and(...conditions) : undefined;

    const [items, [{ count }]] = await Promise.all([
      db.select().from(schema.jobs).where(where).orderBy(desc(schema.jobs.created_at)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(schema.jobs).where(where),
    ]);
    res.json({ items, total: count, limit, offset });
  } catch (e) { next(e); }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const [job] = await db.select().from(schema.jobs).where(eq(schema.jobs.id, String(req.params.id))).limit(1);
    if (!job) throw NotFound();
    if (req.user!.role === "client" && job.customer_email !== req.user!.email) throw Forbidden();
    res.json(job);
  } catch (e) { next(e); }
});

router.post("/", requireAuth, requireRole("admin", "manager", "estimator"), async (req, res, next) => {
  try {
    const data = createJobSchema.parse(req.body);
    // Generate unique job number — retry on collision (1-in-9000 base; cap retries)
    let job_number = generateJobNumber();
    for (let i = 0; i < 5; i++) {
      const [existing] = await db.select({ id: schema.jobs.id }).from(schema.jobs)
        .where(eq(schema.jobs.job_number, job_number)).limit(1);
      if (!existing) break;
      job_number = generateJobNumber();
      if (i === 4) throw Conflict("Could not allocate unique job_number");
    }
    const [job] = await db.insert(schema.jobs).values({
      job_number,
      customer_id: data.customer_id,
      customer_name: data.customer_name,
      customer_email: data.customer_email,
      customer_phone: data.customer_phone,
      property_address: data.property_address,
      city: data.city,
      state: data.state,
      zip: data.zip,
      property_type: data.property_type as any,
      scope_of_work: data.scope_of_work,
      contract_value: data.contract_value?.toString(),
      scheduled_start: data.scheduled_start ? new Date(data.scheduled_start) : null,
      completion_date: data.completion_date ? new Date(data.completion_date) : null,
      warranty_years: data.warranty_years,
      lead_id: data.lead_id,
    }).returning();

    await db.insert(schema.activity_log).values({
      actor_id: req.user!.sub,
      entity_type: "job",
      entity_id: job.id,
      action: "create",
      metadata: { job_number },
    });
    res.status(201).json(job);
  } catch (e) { next(e); }
});

router.patch("/:id", requireAuth, requireRole("admin", "manager", "estimator"), async (req, res, next) => {
  try {
    const data = updateJobSchema.parse(req.body);
    const patch: Record<string, unknown> = { ...data, updated_at: new Date() };
    if (data.contract_value !== undefined) patch.contract_value = data.contract_value.toString();
    if (data.scheduled_start) patch.scheduled_start = new Date(data.scheduled_start);
    if (data.completion_date) patch.completion_date = new Date(data.completion_date);
    const [job] = await db.update(schema.jobs).set(patch as any).where(eq(schema.jobs.id, String(req.params.id))).returning();
    if (!job) throw NotFound();
    await db.insert(schema.activity_log).values({
      actor_id: req.user!.sub,
      entity_type: "job",
      entity_id: job.id,
      action: "update",
      metadata: data,
    });
    res.json(job);
  } catch (e) { next(e); }
});

router.delete("/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const result = await db.delete(schema.jobs).where(eq(schema.jobs.id, String(req.params.id))).returning();
    if (!result.length) throw NotFound();
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// Aggregated smart data — replaces the old getJobSmartData Base44 function
router.get("/:id/smart-data", requireAuth, async (req, res, next) => {
  try {
    const [job] = await db.select().from(schema.jobs).where(eq(schema.jobs.id, String(req.params.id))).limit(1);
    if (!job) throw NotFound();
    if (req.user!.role === "client" && job.customer_email !== req.user!.email) throw Forbidden();

    const [estimates, invoices] = await Promise.all([
      db.select().from(schema.estimates).where(eq(schema.estimates.job_id, job.id)),
      db.select().from(schema.invoices).where(eq(schema.invoices.job_id, job.id)),
    ]);

    const estimateIds = estimates.map(e => e.id);
    const [warranty, measurements, materials] = await Promise.all([
      db.select().from(schema.warranties).where(eq(schema.warranties.job_id, job.id)),
      estimateIds.length
        ? db.select().from(schema.measurement_data).where(sql`estimate_id = ANY(${estimateIds}::uuid[])`)
        : Promise.resolve([]),
      db.select().from(schema.materials).where(eq(schema.materials.job_id, job.id)),
    ]);

    res.json({
      job,
      estimates,
      invoices,
      warranty,
      measurements,
      materials,
    });
  } catch (e) { next(e); }
});

export default router;
