// Reviews:
//   - GET / and GET /:id allow anonymous read of approved reviews (for the
//     public website). Authenticated admins/managers see all reviews.
//   - Write endpoints are admin/manager only.

import { Router } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { requireAuth, requireRole, optionalAuth } from "../auth/middleware.js";
import {
  paginationSchema,
  createReviewSchema,
  updateReviewSchema,
} from "../validators/schemas.js";
import { NotFound } from "../utils/errors.js";

const router = Router();
const STAFF = ["admin", "manager", "office", "office_staff"];

router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const { limit, offset } = paginationSchema.parse(req.query);
    const isStaff = req.user && STAFF.includes(req.user.role);
    const conditions = [] as any[];
    if (!isStaff) conditions.push(eq(schema.reviews.approved, true));
    if ((req.query.featured as string) === "true") conditions.push(eq(schema.reviews.featured, true));
    const where = conditions.length ? and(...conditions) : undefined;

    const [items, [{ count }]] = await Promise.all([
      db.select().from(schema.reviews).where(where).orderBy(desc(schema.reviews.created_at)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(schema.reviews).where(where),
    ]);
    res.json({ items, total: count, limit, offset });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", optionalAuth, async (req, res, next) => {
  try {
    const [item] = await db.select().from(schema.reviews).where(eq(schema.reviews.id, String(req.params.id))).limit(1);
    if (!item) throw NotFound();
    const isStaff = req.user && STAFF.includes(req.user.role);
    if (!isStaff && !item.approved) throw NotFound();
    res.json(item);
  } catch (e) {
    next(e);
  }
});

router.post("/", requireAuth, requireRole(...STAFF), async (req, res, next) => {
  try {
    const data = createReviewSchema.parse(req.body);
    const [item] = await db.insert(schema.reviews).values(data as any).returning();
    res.status(201).json(item);
  } catch (e) {
    next(e);
  }
});

router.patch("/:id", requireAuth, requireRole(...STAFF), async (req, res, next) => {
  try {
    const data = updateReviewSchema.parse(req.body);
    const [item] = await db
      .update(schema.reviews)
      .set({ ...data, updated_at: new Date() } as any)
      .where(eq(schema.reviews.id, String(req.params.id)))
      .returning();
    if (!item) throw NotFound();
    res.json(item);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const result = await db.delete(schema.reviews).where(eq(schema.reviews.id, String(req.params.id))).returning();
    if (!result.length) throw NotFound();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
