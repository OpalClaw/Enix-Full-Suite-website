import { Router } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { paginationSchema, createActivitySchema } from "../validators/schemas.js";

const router = Router();

router.get("/", requireAuth, requireRole("admin", "manager", "office", "office_staff"), async (req, res, next) => {
  try {
    const { limit, offset } = paginationSchema.parse(req.query);
    const entityType = (req.query.entity_type as string | undefined)?.trim();
    const entityId = (req.query.entity_id as string | undefined)?.trim();
    const conditions = [] as any[];
    if (entityType) conditions.push(eq(schema.activity_log.entity_type, entityType));
    if (entityId) conditions.push(eq(schema.activity_log.entity_id, entityId));
    const where = conditions.length ? and(...conditions) : undefined;
    const [items, [{ count }]] = await Promise.all([
      db.select().from(schema.activity_log).where(where).orderBy(desc(schema.activity_log.created_at)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(schema.activity_log).where(where),
    ]);
    res.json({ items, total: count, limit, offset });
  } catch (e) {
    next(e);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const data = createActivitySchema.parse(req.body);
    const [item] = await db
      .insert(schema.activity_log)
      .values({ ...data, actor_id: req.user!.sub } as any)
      .returning();
    res.status(201).json(item);
  } catch (e) {
    next(e);
  }
});

export default router;
