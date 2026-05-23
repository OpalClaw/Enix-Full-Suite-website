import { Router } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { createInvoiceSchema, paginationSchema } from "../validators/schemas.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { NotFound, Forbidden } from "../utils/errors.js";

const router = Router();

function genInvoiceNumber() {
  const y = new Date().getFullYear();
  const r = Math.floor(Math.random() * 9000) + 1000;
  return `INV-${y}-${r}`;
}

function calcTotals(line_items: Array<{ quantity: number; unit_price: number }>) {
  const subtotal = line_items.reduce((s, li) => s + Number(li.quantity) * Number(li.unit_price), 0);
  const tax = 0;
  const total = subtotal + tax;
  return { subtotal: subtotal.toFixed(2), tax: tax.toFixed(2), total: total.toFixed(2) };
}

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { limit, offset } = paginationSchema.parse(req.query);
    let q;
    if (req.user!.role === "client") {
      // Clients see invoices for jobs they own
      const myJobs = await db.select({ id: schema.jobs.id }).from(schema.jobs)
        .where(eq(schema.jobs.customer_email, req.user!.email));
      const jobIds = myJobs.map(j => j.id);
      if (!jobIds.length) return res.json({ items: [], total: 0, limit, offset });
      q = db.select().from(schema.invoices).where(sql`job_id = ANY(${jobIds}::uuid[])`);
    } else {
      q = db.select().from(schema.invoices);
    }
    const items = await q.orderBy(desc(schema.invoices.created_at)).limit(limit).offset(offset);
    res.json({ items, total: items.length, limit, offset });
  } catch (e) { next(e); }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const [inv] = await db.select().from(schema.invoices).where(eq(schema.invoices.id, String(req.params.id))).limit(1);
    if (!inv) throw NotFound();
    if (req.user!.role === "client") {
      const [job] = await db.select().from(schema.jobs).where(eq(schema.jobs.id, inv.job_id)).limit(1);
      if (!job || job.customer_email !== req.user!.email) throw Forbidden();
    }
    res.json(inv);
  } catch (e) { next(e); }
});

router.post("/", requireAuth, requireRole("admin", "manager", "office"), async (req, res, next) => {
  try {
    const data = createInvoiceSchema.parse(req.body);
    const totals = calcTotals(data.line_items);
    const [inv] = await db.insert(schema.invoices).values({
      invoice_number: genInvoiceNumber(),
      job_id: data.job_id,
      customer_id: data.customer_id,
      line_items: data.line_items,
      due_date: data.due_date ? new Date(data.due_date) : null,
      payment_terms: data.payment_terms,
      message: data.message,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
    }).returning();
    res.status(201).json(inv);
  } catch (e) { next(e); }
});

router.post("/:id/send", requireAuth, requireRole("admin", "manager", "office"), async (req, res, next) => {
  try {
    const [inv] = await db.update(schema.invoices)
      .set({ status: "sent", sent_at: new Date(), updated_at: new Date() })
      .where(eq(schema.invoices.id, String(req.params.id))).returning();
    if (!inv) throw NotFound();
    res.json(inv);
  } catch (e) { next(e); }
});

router.post("/:id/payments", requireAuth, requireRole("admin", "manager", "office"), async (req, res, next) => {
  try {
    const { amount, method, reference, notes } = req.body ?? {};
    if (typeof amount !== "number" || amount <= 0) throw new Error("Invalid amount");
    if (!method) throw new Error("Method required");
    await db.transaction(async (tx) => {
      const [inv] = await tx.select().from(schema.invoices).where(eq(schema.invoices.id, String(req.params.id))).limit(1);
      if (!inv) throw NotFound();
      await tx.insert(schema.payments).values({
        invoice_id: inv.id,
        amount: amount.toFixed(2),
        method,
        reference,
        notes,
        recorded_by: req.user!.sub,
      });
      const newPaid = Number(inv.amount_paid) + amount;
      const status = newPaid >= Number(inv.total) ? "paid" : "partial";
      await tx.update(schema.invoices).set({
        amount_paid: newPaid.toFixed(2),
        status,
        paid_at: status === "paid" ? new Date() : inv.paid_at,
        updated_at: new Date(),
      }).where(eq(schema.invoices.id, inv.id));
    });
    res.status(201).json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
