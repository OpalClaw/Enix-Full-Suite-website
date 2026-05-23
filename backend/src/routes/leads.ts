import { Router } from "express";
import rateLimit from "express-rate-limit";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { createLeadSchema, updateLeadSchema, paginationSchema } from "../validators/schemas.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { BadRequest, NotFound } from "../utils/errors.js";

const router = Router();

const publicLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 600_000),
  max: Number(process.env.RATE_LIMIT_MAX_PUBLIC || 5),
  message: { error: "rate_limited" },
  standardHeaders: true,
  legacyHeaders: false,
});

const BOT_UA = /headless|scrapy|curl|wget|axios|httpclient/i;

router.post("/", publicLimiter, async (req, res, next) => {
  try {
    const data = createLeadSchema.parse(req.body);
    // Honeypot already validated as empty by zod
    const ua = req.headers["user-agent"] ?? "";
    if (BOT_UA.test(ua)) return res.json({ ok: true, stored: false }); // silently drop

    const [lead] = await db.insert(schema.leads).values({
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone: data.phone,
      service: data.service,
      property_type: data.property_type,
      address: data.address,
      city: data.city,
      state: data.state,
      zip: data.zip,
      message: data.message,
      source: data.source,
      tcpa_consent: data.tcpa_consent,
      consent_timestamp: new Date(),
      ip_address: (req.ip ?? "").slice(0, 64),
      user_agent: ua.slice(0, 1000),
    }).returning();

    res.status(201).json({ ok: true, stored: true, lead_id: lead.id });
  } catch (e) { next(e); }
});

router.get("/", requireAuth, requireRole("admin", "manager", "office", "estimator"), async (req, res, next) => {
  try {
    const { limit, offset, order } = paginationSchema.parse(req.query);
    const q = (req.query.q as string | undefined)?.trim();
    const status = req.query.status as string | undefined;

    const conditions = [];
    if (status) conditions.push(eq(schema.leads.status, status as any));
    if (q) conditions.push(or(
      ilike(schema.leads.email, `%${q}%`),
      ilike(schema.leads.phone, `%${q}%`),
      ilike(schema.leads.first_name, `%${q}%`),
      ilike(schema.leads.last_name, `%${q}%`),
    ));

    const where = conditions.length ? and(...conditions) : undefined;
    const orderExpr = order === "asc" ? schema.leads.created_at : desc(schema.leads.created_at);

    const [items, [{ count }]] = await Promise.all([
      db.select().from(schema.leads).where(where).orderBy(orderExpr).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(schema.leads).where(where),
    ]);
    res.json({ items, total: count, limit, offset });
  } catch (e) { next(e); }
});

router.get("/:id", requireAuth, requireRole("admin", "manager", "office", "estimator"), async (req, res, next) => {
  try {
    const [lead] = await db.select().from(schema.leads).where(eq(schema.leads.id, String(req.params.id))).limit(1);
    if (!lead) throw NotFound();
    res.json(lead);
  } catch (e) { next(e); }
});

router.patch("/:id", requireAuth, requireRole("admin", "manager", "office", "estimator"), async (req, res, next) => {
  try {
    const data = updateLeadSchema.parse(req.body);
    const [lead] = await db.update(schema.leads).set({ ...data, updated_at: new Date() })
      .where(eq(schema.leads.id, String(req.params.id))).returning();
    if (!lead) throw NotFound();

    await db.insert(schema.activity_log).values({
      actor_id: req.user!.sub,
      entity_type: "lead",
      entity_id: lead.id,
      action: "update",
      metadata: data,
    });
    res.json(lead);
  } catch (e) { next(e); }
});

router.delete("/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const result = await db.delete(schema.leads).where(eq(schema.leads.id, String(req.params.id))).returning();
    if (!result.length) throw NotFound();
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
