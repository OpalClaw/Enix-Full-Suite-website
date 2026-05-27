import { Router } from "express";
import express from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import {
  paginationSchema,
  createMessageSchema,
  sendSmsSchema,
  initiateCallSchema,
} from "../validators/schemas.js";
import { NotFound, BadRequest } from "../utils/errors.js";
import * as twilioService from "../services/twilio.js";
import { logger } from "../utils/logger.js";

const router = Router();

const READ_ROLES = ["admin", "manager", "estimator", "office", "office_staff", "sales_rep", "project_manager", "production_manager"];
const WRITE_ROLES = ["admin", "manager", "estimator", "office", "office_staff", "sales_rep", "project_manager", "production_manager"];

router.get("/", requireAuth, requireRole(...READ_ROLES), async (req, res, next) => {
  try {
    const { limit, offset } = paginationSchema.parse(req.query);
    const jobId = (req.query.job_id as string | undefined)?.trim();
    const conditions = [] as any[];
    if (jobId) conditions.push(eq(schema.messages.job_id, jobId));
    const where = conditions.length ? and(...conditions) : undefined;

    const [items, [{ count }]] = await Promise.all([
      db.select().from(schema.messages).where(where).orderBy(desc(schema.messages.created_at)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(schema.messages).where(where),
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
      .from(schema.messages)
      .where(eq(schema.messages.id, String(req.params.id)))
      .limit(1);
    if (!item) throw NotFound();
    res.json(item);
  } catch (e) {
    next(e);
  }
});

router.post("/", requireAuth, requireRole(...WRITE_ROLES), async (req, res, next) => {
  try {
    const data = createMessageSchema.parse(req.body);
    const [item] = await db
      .insert(schema.messages)
      .values({
        ...data,
        content: data.body,
        sender_id: req.user!.sub,
        sender_name: req.user!.email,
        direction: "outbound",
      })
      .returning();
    res.status(201).json(item);
  } catch (e) {
    next(e);
  }
});

// ---- SMS via Twilio ---------------------------------------------------------
router.post("/send-sms", requireAuth, requireRole(...WRITE_ROLES), async (req, res, next) => {
  try {
    const data = sendSmsSchema.parse(req.body);
    const sent = await twilioService.sendSms({ to: data.to, body: data.body });
    const [item] = await db
      .insert(schema.messages)
      .values({
        job_id: data.job_id ?? null,
        lead_id: data.lead_id ?? null,
        recipient_phone: data.to,
        body: data.body,
        content: data.body,
        channel: "sms",
        direction: "outbound",
        sender_id: req.user!.sub,
        sender_name: req.user!.email,
        twilio_sid: sent.sid,
        twilio_status: sent.status,
      })
      .returning();
    res.status(201).json(item);
  } catch (e) {
    next(e);
  }
});

// ---- Voice via Twilio -------------------------------------------------------
router.post("/call", requireAuth, requireRole(...WRITE_ROLES), async (req, res, next) => {
  try {
    const data = initiateCallSchema.parse(req.body);
    const call = await twilioService.initiateCall({ to: data.to, twimlUrl: data.twiml_url });
    // Log call as an internal message for audit
    await db.insert(schema.messages).values({
      job_id: data.job_id ?? null,
      recipient_phone: data.to,
      body: `Outbound call initiated`,
      content: `Outbound call initiated (Twilio SID ${call.sid})`,
      channel: "sms",
      direction: "outbound",
      is_internal: true,
      sender_id: req.user!.sub,
      sender_name: req.user!.email,
      twilio_sid: call.sid,
      twilio_status: call.status,
      metadata: { type: "call" },
    });
    res.status(201).json({ sid: call.sid, status: call.status });
  } catch (e) {
    next(e);
  }
});

// ---- Twilio inbound webhook -------------------------------------------------
// Mounted as urlencoded — Twilio posts application/x-www-form-urlencoded.
router.post(
  "/twilio-webhook",
  express.urlencoded({ extended: false }),
  async (req, res, next) => {
    try {
      const sig = req.header("x-twilio-signature");
      const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol;
      const host = req.get("host");
      const fullUrl = `${proto}://${host}${req.originalUrl}`;
      const valid = await twilioService.validateWebhookSignature(sig, fullUrl, req.body ?? {});
      if (!valid) throw BadRequest("Invalid Twilio signature");

      const params = req.body as Record<string, string>;
      // SMS inbound
      if (params.Body) {
        await db.insert(schema.messages).values({
          recipient_phone: params.To,
          body: params.Body,
          content: params.Body,
          channel: "sms",
          direction: "inbound",
          twilio_sid: params.MessageSid,
          twilio_status: params.SmsStatus,
          sender_name: params.From,
          metadata: { from: params.From },
        });
        logger.info({ sid: params.MessageSid }, "twilio inbound sms recorded");
      } else if (params.CallStatus) {
        // Call status callback
        await db
          .update(schema.messages)
          .set({ twilio_status: params.CallStatus })
          .where(eq(schema.messages.twilio_sid, params.CallSid ?? params.MessageSid ?? ""));
        logger.info({ sid: params.CallSid, status: params.CallStatus }, "twilio call status updated");
      }
      res.type("text/xml").send("<Response></Response>");
    } catch (e) {
      next(e);
    }
  },
);

router.delete("/:id", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const result = await db
      .delete(schema.messages)
      .where(eq(schema.messages.id, String(req.params.id)))
      .returning();
    if (!result.length) throw NotFound();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
