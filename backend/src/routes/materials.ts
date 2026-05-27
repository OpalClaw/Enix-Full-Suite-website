import { Router } from "express";
import { desc, eq, sql } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import {
  paginationSchema,
  createMaterialSchema,
  updateMaterialSchema,
} from "../validators/schemas.js";
import { NotFound, ServiceUnavailable } from "../utils/errors.js";
import * as abcSupply from "../services/abcSupply.js";

const router = Router();

const READ = ["admin", "manager", "estimator", "office", "office_staff", "project_manager", "production_manager", "crew_lead", "crew"];
const WRITE = ["admin", "manager", "estimator", "office_staff", "project_manager", "production_manager"];

router.get("/", requireAuth, requireRole(...READ), async (req, res, next) => {
  try {
    const { limit, offset } = paginationSchema.parse(req.query);
    const [items, [{ count }]] = await Promise.all([
      db.select().from(schema.materials).orderBy(desc(schema.materials.ordered_at)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(schema.materials),
    ]);
    res.json({ items, total: count, limit, offset });
  } catch (e) {
    next(e);
  }
});

router.get("/catalog", requireAuth, requireRole(...READ), async (req, res, next) => {
  try {
    const { limit, offset } = paginationSchema.parse(req.query);
    const [items, [{ count }]] = await Promise.all([
      db.select().from(schema.material_catalog).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(schema.material_catalog),
    ]);
    res.json({ items, total: count, limit, offset });
  } catch (e) {
    next(e);
  }
});

router.post("/catalog/sync", requireAuth, requireRole("admin", "manager"), async (_req, res, next) => {
  try {
    const items = await abcSupply.listCatalog();
    if (!items.length) {
      res.json({ ok: true, synced: 0, note: "No items returned from ABC Supply" });
      return;
    }
    let upserted = 0;
    for (const it of items) {
      await db
        .insert(schema.material_catalog)
        .values({
          name: it.name,
          category: it.category,
          manufacturer: it.manufacturer,
          sku: it.sku,
          unit: it.unit,
          unit_cost: it.unit_cost?.toString(),
        } as any)
        .onConflictDoNothing();
      upserted++;
    }
    res.json({ ok: true, synced: upserted });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", requireAuth, requireRole(...READ), async (req, res, next) => {
  try {
    const [item] = await db.select().from(schema.materials).where(eq(schema.materials.id, String(req.params.id))).limit(1);
    if (!item) throw NotFound();
    res.json(item);
  } catch (e) {
    next(e);
  }
});

router.post("/", requireAuth, requireRole(...WRITE), async (req, res, next) => {
  try {
    const data = createMaterialSchema.parse(req.body);
    const [item] = await db.insert(schema.materials).values(data as any).returning();
    res.status(201).json(item);
  } catch (e) {
    next(e);
  }
});

router.patch("/:id", requireAuth, requireRole(...WRITE), async (req, res, next) => {
  try {
    const data = updateMaterialSchema.parse(req.body);
    const [item] = await db
      .update(schema.materials)
      .set(data as any)
      .where(eq(schema.materials.id, String(req.params.id)))
      .returning();
    if (!item) throw NotFound();
    res.json(item);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const result = await db.delete(schema.materials).where(eq(schema.materials.id, String(req.params.id))).returning();
    if (!result.length) throw NotFound();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
