// Admin user management — list, get, update role/title, deactivate.
// Strictly gated to admin/manager. Invite flows live under /api/auth.

import { Router } from "express";
import { desc, eq, sql } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { paginationSchema, updateUserSchema } from "../validators/schemas.js";
import { NotFound, BadRequest } from "../utils/errors.js";

const router = Router();

const USER_FIELDS = {
  id: schema.users.id,
  email: schema.users.email,
  full_name: schema.users.full_name,
  role: schema.users.role,
  phone: schema.users.phone,
  title: schema.users.title,
  company: schema.users.company,
  assigned_territory: schema.users.assigned_territory,
  crew_id: schema.users.crew_id,
  active: schema.users.active,
  last_login_at: schema.users.last_login_at,
  client_job_number: schema.users.client_job_number,
  created_at: schema.users.created_at,
  updated_at: schema.users.updated_at,
};

router.get("/", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const { limit, offset } = paginationSchema.parse(req.query);
    const [items, [{ count }]] = await Promise.all([
      db.select(USER_FIELDS).from(schema.users).orderBy(desc(schema.users.created_at)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(schema.users),
    ]);
    res.json({ items, total: count, limit, offset });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const [item] = await db.select(USER_FIELDS).from(schema.users).where(eq(schema.users.id, String(req.params.id))).limit(1);
    if (!item) throw NotFound();
    res.json(item);
  } catch (e) {
    next(e);
  }
});

router.patch("/:id", requireAuth, requireRole("admin", "manager"), async (req, res, next) => {
  try {
    const data = updateUserSchema.parse(req.body);
    // Only admins can change role.
    if (data.role && req.user!.role !== "admin") {
      throw BadRequest("Only admins may change roles");
    }
    const [item] = await db
      .update(schema.users)
      .set({ ...data, updated_at: new Date() })
      .where(eq(schema.users.id, String(req.params.id)))
      .returning(USER_FIELDS);
    if (!item) throw NotFound();
    res.json(item);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    if (req.params.id === req.user!.sub) throw BadRequest("Cannot delete your own account");
    // Soft-deactivate rather than hard delete so audit trails are preserved.
    const [item] = await db
      .update(schema.users)
      .set({ active: false, updated_at: new Date() })
      .where(eq(schema.users.id, String(req.params.id)))
      .returning(USER_FIELDS);
    if (!item) throw NotFound();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
