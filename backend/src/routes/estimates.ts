import { Router } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { createEstimateSchema, paginationSchema } from "../validators/schemas.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { NotFound } from "../utils/errors.js";

const router = Router();

function genEstimateNumber() {
  const y = new Date().getFullYear();
  const r = Math.floor(Math.random() * 9000) + 1000;
  return `EST-${y}-${r}`;
}

function calcTotals(line_items: Array<{ quantity: number; unit_price: number }>) {
  const subtotal = line_items.reduce((s, li) => s + Number(li.quantity) * Number(li.unit_price), 0);
  const tax = 0;
  const total = subtotal + tax;
  return { subtotal: subtotal.toFixed(2), tax: tax.toFixed(2), total: total.toFixed(2) };
}

router.get("/", requireAuth, requireRole("admin", "manager", "estimator", "office"), async (req, res, next) => {
  try {
    const { limit, offset } = paginationSchema.parse(req.query);
    const items = await db.select().from(schema.estimates).orderBy(desc(schema.estimates.created_at)).limit(limit).offset(offset);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.estimates);
    res.json({ items, total: count, limit, offset });
  } catch (e) { next(e); }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const [estimate] = await db.select().from(schema.estimates).where(eq(schema.estimates.id, String(req.params.id))).limit(1);
    if (!estimate) throw NotFound();
    res.json(estimate);
  } catch (e) { next(e); }
});

router.post("/", requireAuth, requireRole("admin", "manager", "estimator"), async (req, res, next) => {
  try {
    const data = createEstimateSchema.parse(req.body);
    const totals = calcTotals(data.line_items);
    const [estimate] = await db.insert(schema.estimates).values({
      estimate_number: genEstimateNumber(),
      job_id: data.job_id,
      lead_id: data.lead_id,
      customer_id: data.customer_id,
      line_items: data.line_items,
      measurements: data.measurements,
      valid_until: data.valid_until ? new Date(data.valid_until) : null,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      created_by: req.user!.sub,
    }).returning();
    res.status(201).json(estimate);
  } catch (e) { next(e); }
});

router.patch("/:id", requireAuth, requireRole("admin", "manager", "estimator"), async (req, res, next) => {
  try {
    const data = createEstimateSchema.partial().parse(req.body);
    const patch: Record<string, unknown> = { ...data, updated_at: new Date() };
    if (data.line_items) {
      const t = calcTotals(data.line_items);
      patch.subtotal = t.subtotal; patch.tax = t.tax; patch.total = t.total;
    }
    if (data.valid_until) patch.valid_until = new Date(data.valid_until);
    const [estimate] = await db.update(schema.estimates).set(patch as any).where(eq(schema.estimates.id, String(req.params.id))).returning();
    if (!estimate) throw NotFound();
    res.json(estimate);
  } catch (e) { next(e); }
});

router.post("/:id/send", requireAuth, requireRole("admin", "manager", "estimator"), async (req, res, next) => {
  try {
    const [estimate] = await db.update(schema.estimates)
      .set({ status: "sent", sent_at: new Date(), updated_at: new Date() })
      .where(eq(schema.estimates.id, String(req.params.id))).returning();
    if (!estimate) throw NotFound();
    res.json(estimate);
  } catch (e) { next(e); }
});


router.post(
  "/:id/approve",
  // Public endpoint with optional client-login session for portal users
  async (req, res, next) => {
    try {
      const id = String(req.params.id);
      const { signature, customer_email } = req.body ?? {};
      if (!signature) {
        return res.status(400).json({ error: "bad_request", message: "signature is required" });
      }
      const updated = await db
        .update(schema.estimates)
        .set({
          status: "accepted",
          accepted_at: new Date(),
          updated_at: new Date(),
        })
        .where(eq(schema.estimates.id, id))
        .returning();
      const arr = (updated as any[]);
      if (!arr.length) return res.status(404).json({ error: "not_found" });
      await db.insert(schema.activity_log).values({
        entity_type: "estimate",
        entity_id: id,
        action: "approved",
        actor_email: customer_email ?? null,
        details: { method: "portal-signature", signature_hash: signature ? "captured" : "missing" },
      } as any);
      res.json({ ok: true, estimate: arr[0] });
    } catch (e) { next(e); }
  },
);

export default router;
