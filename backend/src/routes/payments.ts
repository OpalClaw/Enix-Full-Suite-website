import { Router } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import {
  paginationSchema,
  createPaymentSchema,
  updatePaymentSchema,
} from "../validators/schemas.js";
import { NotFound, BadRequest } from "../utils/errors.js";

const router = Router();
const READ = ["admin", "manager", "office", "office_staff", "estimator"];
const WRITE = ["admin", "manager", "office", "office_staff"];

router.get("/", requireAuth, requireRole(...READ), async (req, res, next) => {
  try {
    const { limit, offset } = paginationSchema.parse(req.query);
    const invoiceId = (req.query.invoice_id as string | undefined)?.trim();
    const conditions = [] as any[];
    if (invoiceId) conditions.push(eq(schema.payments.invoice_id, invoiceId));
    const where = conditions.length ? and(...conditions) : undefined;
    const [items, [{ count }]] = await Promise.all([
      db.select().from(schema.payments).where(where).orderBy(desc(schema.payments.received_at)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(schema.payments).where(where),
    ]);
    res.json({ items, total: count, limit, offset });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", requireAuth, requireRole(...READ), async (req, res, next) => {
  try {
    const [item] = await db.select().from(schema.payments).where(eq(schema.payments.id, String(req.params.id))).limit(1);
    if (!item) throw NotFound();
    res.json(item);
  } catch (e) {
    next(e);
  }
});

router.post("/", requireAuth, requireRole(...WRITE), async (req, res, next) => {
  try {
    const data = createPaymentSchema.parse(req.body);
    const [invoice] = await db.select().from(schema.invoices).where(eq(schema.invoices.id, data.invoice_id)).limit(1);
    if (!invoice) throw BadRequest("Invoice not found");

    const [item] = await db
      .insert(schema.payments)
      .values({
        invoice_id: data.invoice_id,
        amount: data.amount.toString(),
        method: data.method,
        reference: data.reference,
        notes: data.notes,
        received_at: data.received_at ? new Date(data.received_at) : new Date(),
        recorded_by: req.user!.sub,
      })
      .returning();

    // Roll up amount_paid + status on the invoice
    const newPaid = Number(invoice.amount_paid ?? 0) + data.amount;
    const total = Number(invoice.total ?? 0);
    const nextStatus = newPaid >= total ? "paid" : newPaid > 0 ? "partial" : invoice.status;
    await db
      .update(schema.invoices)
      .set({
        amount_paid: newPaid.toString(),
        status: nextStatus as any,
        paid_at: newPaid >= total ? new Date() : invoice.paid_at,
        updated_at: new Date(),
      })
      .where(eq(schema.invoices.id, data.invoice_id));

    res.status(201).json(item);
  } catch (e) {
    next(e);
  }
});

router.patch("/:id", requireAuth, requireRole(...WRITE), async (req, res, next) => {
  try {
    const data = updatePaymentSchema.parse(req.body);
    const update: any = { ...data };
    if (data.received_at) update.received_at = new Date(data.received_at);
    if (data.amount !== undefined) update.amount = data.amount.toString();
    const [item] = await db.update(schema.payments).set(update).where(eq(schema.payments.id, String(req.params.id))).returning();
    if (!item) throw NotFound();
    res.json(item);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const result = await db.delete(schema.payments).where(eq(schema.payments.id, String(req.params.id))).returning();
    if (!result.length) throw NotFound();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
