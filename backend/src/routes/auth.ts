import { Router } from "express";
import argon2 from "argon2";
import { eq } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { loginSchema, registerSchema, clientLoginSchema } from "../validators/schemas.js";
import {
  signAccess, signRefresh, verifyRefresh, hashToken, generateSessionId,
} from "../auth/tokens.js";
import { setAuthCookies, clearAuthCookies } from "../services/cookies.js";
import { Unauthorized, BadRequest, Conflict, NotFound } from "../utils/errors.js";
import { requireAuth } from "../auth/middleware.js";

const router = Router();

router.post("/register", async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const existing = await db.select().from(schema.users).where(eq(schema.users.email, data.email)).limit(1);
    if (existing.length) throw Conflict("Email already registered");
    const password_hash = await argon2.hash(data.password, { type: argon2.argon2id });
    const [user] = await db.insert(schema.users).values({
      email: data.email,
      password_hash,
      full_name: data.full_name,
      phone: data.phone,
      role: "client",
    }).returning();
    res.status(201).json({ id: user.id, email: user.email, role: user.role });
  } catch (e) { next(e); }
});

router.post("/login", async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, data.email)).limit(1);
    if (!user || !user.password_hash) throw Unauthorized("Invalid credentials");
    const ok = await argon2.verify(user.password_hash, data.password);
    if (!ok) throw Unauthorized("Invalid credentials");
    if (!user.active) throw Unauthorized("Account disabled");

    const sessionId = generateSessionId();
    const access = signAccess({ sub: user.id, email: user.email, role: user.role });
    const refresh = signRefresh({ sub: user.id, jti: sessionId });
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await db.insert(schema.sessions).values({
      id: sessionId,
      user_id: user.id,
      refresh_token_hash: hashToken(refresh),
      user_agent: req.headers["user-agent"] ?? null,
      ip: (req.ip ?? "").slice(0, 64),
      expires_at: expires,
    });
    await db.update(schema.users).set({ last_login_at: new Date() }).where(eq(schema.users.id, user.id));

    setAuthCookies(res, access, refresh);
    res.json({ user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role } });
  } catch (e) { next(e); }
});

router.post("/client-login", async (req, res, next) => {
  try {
    const data = clientLoginSchema.parse(req.body);
    // Find a job by number — if customer_email matches, issue a client session
    const [job] = await db.select().from(schema.jobs).where(eq(schema.jobs.job_number, data.job_number)).limit(1);
    if (!job) throw NotFound("Job number not found");
    if (!job.customer_email || job.customer_email.toLowerCase() !== data.email.toLowerCase()) {
      throw Unauthorized("Job number and email do not match");
    }
    // Find or create a client user
    let [user] = await db.select().from(schema.users).where(eq(schema.users.email, job.customer_email)).limit(1);
    if (!user) {
      [user] = await db.insert(schema.users).values({
        email: job.customer_email,
        full_name: job.customer_name,
        role: "client",
        client_job_number: data.job_number,
      }).returning();
    }
    const sessionId = generateSessionId();
    const access = signAccess({ sub: user.id, email: user.email, role: user.role });
    const refresh = signRefresh({ sub: user.id, jti: sessionId });
    await db.insert(schema.sessions).values({
      id: sessionId,
      user_id: user.id,
      refresh_token_hash: hashToken(refresh),
      user_agent: req.headers["user-agent"] ?? null,
      ip: (req.ip ?? "").slice(0, 64),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    setAuthCookies(res, access, refresh);
    res.json({ user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role }, job });
  } catch (e) { next(e); }
});

router.post("/refresh", async (req, res, next) => {
  try {
    const token = req.cookies?.enix_refresh;
    if (!token) throw Unauthorized("Missing refresh token");
    const claims = verifyRefresh(token);
    const [session] = await db.select().from(schema.sessions).where(eq(schema.sessions.id, claims.jti)).limit(1);
    if (!session || session.revoked_at) throw Unauthorized("Session revoked");
    if (session.refresh_token_hash !== hashToken(token)) throw Unauthorized("Refresh token mismatch");
    if (session.expires_at < new Date()) throw Unauthorized("Session expired");

    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, claims.sub)).limit(1);
    if (!user || !user.active) throw Unauthorized("Account disabled");

    // Rotate
    const newSessionId = generateSessionId();
    const access = signAccess({ sub: user.id, email: user.email, role: user.role });
    const refresh = signRefresh({ sub: user.id, jti: newSessionId });
    await db.transaction(async (tx) => {
      await tx.update(schema.sessions).set({ revoked_at: new Date() }).where(eq(schema.sessions.id, session.id));
      await tx.insert(schema.sessions).values({
        id: newSessionId,
        user_id: user.id,
        refresh_token_hash: hashToken(refresh),
        user_agent: req.headers["user-agent"] ?? null,
        ip: (req.ip ?? "").slice(0, 64),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
    });
    setAuthCookies(res, access, refresh);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.post("/logout", async (req, res, next) => {
  try {
    const token = req.cookies?.enix_refresh;
    if (token) {
      try {
        const claims = verifyRefresh(token);
        await db.update(schema.sessions).set({ revoked_at: new Date() }).where(eq(schema.sessions.id, claims.jti));
      } catch { /* ignore */ }
    }
    clearAuthCookies(res);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const [user] = await db.select({
      id: schema.users.id, email: schema.users.email, full_name: schema.users.full_name,
      role: schema.users.role, phone: schema.users.phone, active: schema.users.active,
    }).from(schema.users).where(eq(schema.users.id, req.user!.sub)).limit(1);
    if (!user) throw Unauthorized();
    res.json({ user });
  } catch (e) { next(e); }
});

export default router;
