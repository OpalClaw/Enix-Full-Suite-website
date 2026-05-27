import { Router } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  paginationSchema,
} from "../validators/schemas.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { NotFound, Forbidden, BadRequest, Conflict } from "../utils/errors.js";
import { createInvoice as qboCreateInvoice } from "../services/quickbooks.js";
import { logger } from "../utils/logger.js";

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

// ---------------------------------------------------------------------------
// PATCH /api/invoices/:id — edit line items, customer, dates, status
// ---------------------------------------------------------------------------
router.patch(
  "/:id",
  requireAuth,
  requireRole("admin", "manager", "office"),
  async (req, res, next) => {
    try {
      const data = updateInvoiceSchema.parse(req.body);
      const [existing] = await db
        .select()
        .from(schema.invoices)
        .where(eq(schema.invoices.id, String(req.params.id)))
        .limit(1);
      if (!existing) throw NotFound();

      const patch: Record<string, unknown> = {
        updated_at: new Date(),
      };

      if (data.customer_id !== undefined) patch.customer_id = data.customer_id;
      if (data.due_date !== undefined) {
        patch.due_date = data.due_date ? new Date(data.due_date) : null;
      }
      if (data.payment_terms !== undefined) patch.payment_terms = data.payment_terms;
      if (data.message !== undefined) patch.message = data.message;
      if (data.status !== undefined) {
        patch.status = data.status;
        if (data.status === "paid" && !existing.paid_at) {
          patch.paid_at = new Date();
        }
        if (data.status === "sent" && !existing.sent_at) {
          patch.sent_at = new Date();
        }
      }

      if (data.line_items !== undefined) {
        patch.line_items = data.line_items;
        const subtotal = data.line_items.reduce(
          (s, li) => s + Number(li.quantity) * Number(li.unit_price),
          0,
        );
        const tax = 0;
        const total = subtotal + tax;
        patch.subtotal = subtotal.toFixed(2);
        patch.tax = tax.toFixed(2);
        patch.total = total.toFixed(2);
        // Re-syncing required after content changes
        patch.quickbooks_synced_at = null;
      }

      const [inv] = await db
        .update(schema.invoices)
        .set(patch)
        .where(eq(schema.invoices.id, existing.id))
        .returning();
      res.json(inv);
    } catch (e) {
      next(e);
    }
  },
);

// ---------------------------------------------------------------------------
// DELETE /api/invoices/:id — soft-cancel; refuse if payments recorded
// ---------------------------------------------------------------------------
router.delete(
  "/:id",
  requireAuth,
  requireRole("admin", "manager"),
  async (req, res, next) => {
    try {
      const [existing] = await db
        .select()
        .from(schema.invoices)
        .where(eq(schema.invoices.id, String(req.params.id)))
        .limit(1);
      if (!existing) throw NotFound();

      if (Number(existing.amount_paid) > 0) {
        throw Conflict(
          "Cannot delete an invoice with recorded payments. Void it instead by setting status to void.",
        );
      }

      const [inv] = await db
        .update(schema.invoices)
        .set({ status: "void", updated_at: new Date() })
        .where(eq(schema.invoices.id, existing.id))
        .returning();
      res.json({ ok: true, invoice: inv });
    } catch (e) {
      next(e);
    }
  },
);

// ---------------------------------------------------------------------------
// POST /api/invoices/:id/sync-qbo — push invoice to QuickBooks Online
// ---------------------------------------------------------------------------
router.post(
  "/:id/sync-qbo",
  requireAuth,
  requireRole("admin", "manager", "office"),
  async (req, res, next) => {
    try {
      const [inv] = await db
        .select()
        .from(schema.invoices)
        .where(eq(schema.invoices.id, String(req.params.id)))
        .limit(1);
      if (!inv) throw NotFound();

      const [customer] = await db
        .select()
        .from(schema.customers)
        .where(eq(schema.customers.id, inv.customer_id))
        .limit(1);
      if (!customer) throw BadRequest("Invoice has no resolvable customer");

      const lineItems = Array.isArray(inv.line_items) ? inv.line_items : [];
      if (lineItems.length === 0) {
        throw BadRequest("Invoice has no line items to sync");
      }

      try {
        const qbo = await qboCreateInvoice({
          customer_ref_id: customer.id,
          customer_name: customer.name ?? undefined,
          due_date: inv.due_date ? new Date(inv.due_date).toISOString().slice(0, 10) : undefined,
          invoice_number: inv.invoice_number,
          customer_memo: inv.message ?? undefined,
          line_items: lineItems.map((li: any) => ({
            description: li.description ?? "Line item",
            amount: Number(li.quantity ?? 1) * Number(li.unit_price ?? 0),
          })),
        });
        const [updated] = await db
          .update(schema.invoices)
          .set({
            quickbooks_id: qbo.id,
            quickbooks_doc_number: qbo.doc_number,
            quickbooks_synced_at: new Date(),
            quickbooks_sync_error: null,
            updated_at: new Date(),
          })
          .where(eq(schema.invoices.id, inv.id))
          .returning();
        res.json(updated);
      } catch (err) {
        const message = (err as Error).message ?? "QuickBooks sync failed";
        logger.warn({ err, invoice_id: inv.id }, "quickbooks sync failed");
        await db
          .update(schema.invoices)
          .set({
            quickbooks_sync_error: message,
            updated_at: new Date(),
          })
          .where(eq(schema.invoices.id, inv.id));
        const status =
          message.toLowerCase().includes("not configured") ||
          message.toLowerCase().includes("service unavailable")
            ? 503
            : 502;
        res.status(status).json({
          error: status === 503 ? "service_unavailable" : "upstream_failed",
          message,
        });
      }
    } catch (e) {
      next(e);
    }
  },
);

export default router;
