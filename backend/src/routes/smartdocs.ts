import { Router } from "express";
import { eq, desc, sql } from "drizzle-orm";
import crypto from "node:crypto";
import { z } from "zod";
import { db, schema } from "../db/index.js";
import { paginationSchema } from "../validators/schemas.js";
import { requireAuth, requireRole, optionalAuth } from "../auth/middleware.js";
import { BadRequest, NotFound, Unauthorized } from "../utils/errors.js";

const router = Router();

const recipientSchema = z.object({
  email: z.string().email(),
  name: z.string().max(200).optional(),
  role: z.string().max(50).optional(),
});

const createDocSchema = z.object({
  job_id: z.string().uuid().optional(),
  template_id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  document_type: z.string().min(1).max(50),
  content: z.record(z.string(), z.unknown()).default({}),
  recipients: z.array(recipientSchema).min(0).default([]),
});

// Admin CRUD
router.get("/", requireAuth, requireRole("admin", "manager", "office"), async (req, res, next) => {
  try {
    const { limit, offset } = paginationSchema.parse(req.query);
    const items = await db.select().from(schema.smart_documents).orderBy(desc(schema.smart_documents.created_at)).limit(limit).offset(offset);
    res.json({ items, total: items.length, limit, offset });
  } catch (e) { next(e); }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const [doc] = await db.select().from(schema.smart_documents).where(eq(schema.smart_documents.id, String(req.params.id))).limit(1);
    if (!doc) throw NotFound();
    res.json(doc);
  } catch (e) { next(e); }
});

router.post("/", requireAuth, requireRole("admin", "manager", "estimator"), async (req, res, next) => {
  try {
    const data = createDocSchema.parse(req.body);
    const [doc] = await db.insert(schema.smart_documents).values({
      job_id: data.job_id,
      template_id: data.template_id,
      title: data.title,
      document_type: data.document_type,
      content: data.content,
      recipients: data.recipients.map(r => ({ ...r, signed_at: null, signer_token: null })),
      created_by: req.user!.sub,
    }).returning();
    await db.insert(schema.document_audit_log).values({
      document_id: doc.id,
      action: "create",
      actor_id: req.user!.sub,
      actor_email: req.user!.email,
    });
    res.status(201).json(doc);
  } catch (e) { next(e); }
});

// Send for signature
router.post("/:id/send", requireAuth, requireRole("admin", "manager", "estimator"), async (req, res, next) => {
  try {
    const [doc] = await db.select().from(schema.smart_documents).where(eq(schema.smart_documents.id, String(req.params.id))).limit(1);
    if (!doc) throw NotFound();

    const recipients = (doc.recipients as any[]).map(r => ({
      ...r,
      signer_token: r.signer_token ?? crypto.randomUUID(),
      signed_at: r.signed_at ?? null,
    }));

    const base = process.env.APP_BASE_URL || "https://enixexteriors.com";
    const signingLinks = recipients.map((r: any) => ({
      email: r.email,
      url: `${base}/sign/${doc.id}/${r.signer_token}`,
    }));

    await db.update(schema.smart_documents).set({
      recipients,
      status: "sent",
      sent_at: new Date(),
      updated_at: new Date(),
    }).where(eq(schema.smart_documents.id, doc.id));

    await db.insert(schema.document_audit_log).values({
      document_id: doc.id,
      action: "sent",
      actor_id: req.user!.sub,
      actor_email: req.user!.email,
      details: { recipient_count: recipients.length },
    });

    res.json({ ok: true, signing_links: signingLinks });
  } catch (e) { next(e); }
});

// PUBLIC — signing endpoints (token-gated, no auth)
router.get("/sign/:id/:token", async (req, res, next) => {
  try {
    const [doc] = await db.select().from(schema.smart_documents).where(eq(schema.smart_documents.id, String(req.params.id))).limit(1);
    if (!doc) throw NotFound("Document not found");
    const recipient = (doc.recipients as any[]).find(r => r.signer_token === req.params.token);
    if (!recipient) throw Unauthorized("Invalid signing token");
    res.json({
      id: doc.id,
      title: doc.title,
      document_type: doc.document_type,
      content: doc.content,
      status: doc.status,
      recipient: { email: recipient.email, name: recipient.name, signed_at: recipient.signed_at },
    });
  } catch (e) { next(e); }
});

router.post("/sign/:id/:token", async (req, res, next) => {
  try {
    const { signature_data, initial_data } = req.body ?? {};
    if (!signature_data || typeof signature_data !== "string") throw BadRequest("signature_data required");
    if (signature_data.length > 200_000) throw BadRequest("Signature payload too large");

    const [doc] = await db.select().from(schema.smart_documents).where(eq(schema.smart_documents.id, String(req.params.id))).limit(1);
    if (!doc) throw NotFound();
    const recipients = (doc.recipients as any[]).map(r => r.signer_token === req.params.token
      ? { ...r, signed_at: new Date().toISOString() }
      : r
    );
    const target = recipients.find(r => r.signer_token === req.params.token);
    if (!target) throw Unauthorized("Invalid signing token");
    if (target.signed_at && target.signed_at !== new Date().toISOString().slice(0, 10)) {
      // already signed previously
    }
    const allSigned = recipients.every(r => r.signed_at);

    await db.transaction(async (tx) => {
      await tx.update(schema.smart_documents).set({
        recipients,
        status: allSigned ? "completed" : "sent",
        completed_at: allSigned ? new Date() : null,
        updated_at: new Date(),
      }).where(eq(schema.smart_documents.id, doc.id));
      await tx.insert(schema.signature_events).values({
        document_id: doc.id,
        signer_email: target.email,
        signer_name: target.name ?? null,
        event_type: "signed",
        signature_data,
        ip_address: (req.ip ?? "").slice(0, 64),
        device_info: (req.headers["user-agent"] ?? "").toString().slice(0, 500),
      });
      await tx.insert(schema.document_audit_log).values({
        document_id: doc.id,
        action: "signed",
        actor_email: target.email,
        details: { all_signed: allSigned, has_initials: Boolean(initial_data) },
      });
    });

    res.json({ ok: true, all_signed: allSigned });
  } catch (e) { next(e); }
});


// POST /smartdocs/:id/pdf — Generate a downloadable PDF rendering of a smart document.
// Heavy lift is the rendering pipeline. Stubbed here so the frontend contract is honored;
// wire pdf-lib or a headless Chromium step in Phase B.
router.post(
  "/:id/pdf",
  requireAuth,
  requireRole("admin", "manager", "estimator", "office"),
  async (req, res, next) => {
    try {
      const id = String(req.params.id);
      const [doc] = await db
        .select()
        .from(schema.smart_documents)
        .where(eq(schema.smart_documents.id, id));
      if (!doc) throw NotFound("Document not found");
      // TODO Phase B: render PDF via pdf-lib using doc.content blocks and stored signatures.
      res.status(501).json({
        ok: false,
        error: "not_implemented",
        message: "PDF rendering will be implemented in Phase B. Document data is available at GET /smartdocs/:id.",
      });
    } catch (e) {
      next(e);
    }
  },
);

export default router;
