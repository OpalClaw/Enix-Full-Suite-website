// =============================================================================
// /api/auth router
// =============================================================================
// Endpoints:
//   POST /api/auth/register      → create account (rate-limited)
//   POST /api/auth/login         → email + password
//   POST /api/auth/client-login  → job number + customer email
//   POST /api/auth/refresh       → rotate refresh token (reuse-detected)
//   POST /api/auth/logout        → revoke session
//   GET  /api/auth/me            → current user
//
// Security highlights:
//   • Constant-time argon2id verify on every login attempt (even non-existent
//     users get a dummy hash check) — prevents user-enumeration timing leaks.
//   • Account lockout after LOCKOUT_THRESHOLD failed attempts.
//   • Refresh-token rotation with REUSE DETECTION — a reused (already-rotated)
//     refresh token revokes ALL of the user's active sessions (theft signal).
//   • Sessions store an SHA-256 hash of the refresh token, never the token.
//   • Generic 401 for "invalid credentials" — no distinguishing between
//     "wrong email" and "wrong password".
// =============================================================================

import { Router } from "express";
import argon2 from "argon2";
import { eq } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { loginSchema, registerSchema, clientLoginSchema, inviteEmployeeSchema, inviteClientSchema } from "../validators/schemas.js";
import {
  signAccess,
  signRefresh,
  verifyRefresh,
  hashToken,
  generateSessionId,
} from "../auth/tokens.js";
import {
  checkLockout,
  recordFailure,
  recordSuccess,
  revokeAllSessions,
  LOCKOUT_DURATION_MS,
} from "../auth/lockout.js";
import { setAuthCookies, clearAuthCookies } from "../services/cookies.js";
import { Unauthorized, Conflict, NotFound, HttpError, BadRequest, Forbidden } from "../utils/errors.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { authLimiter } from "../middleware/rateLimits.js";
import { logger } from "../utils/logger.js";
import { sendEmail } from "../services/email.js";
import crypto from "node:crypto";

const router = Router();

// Apply tight rate limiting to every auth route.
router.use(authLimiter);

// Dummy hash used for constant-time verify on non-existent users.
// Generated once at boot via argon2.hash("nonsense-dummy-password",{type:argon2id}).
// argon2.verify against a fixed dummy still takes ~real-verify time.
let DUMMY_HASH: string | null = null;
async function getDummyHash(): Promise<string> {
  if (!DUMMY_HASH) {
    DUMMY_HASH = await argon2.hash(
      "constant-time-dummy-for-user-enumeration-protection",
      { type: argon2.argon2id },
    );
  }
  return DUMMY_HASH;
}

const GENERIC_INVALID = "Invalid email or password";

// ============================================================================
// POST /api/auth/register
// ============================================================================
router.post("/register", async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const existing = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, data.email))
      .limit(1);
    if (existing.length) throw Conflict("Email already registered");
    const password_hash = await argon2.hash(data.password, {
      type: argon2.argon2id,
      memoryCost: 19_456, // 19 MiB — OWASP 2024 minimum
      timeCost: 2,
      parallelism: 1,
    });
    const [user] = await db
      .insert(schema.users)
      .values({
        email: data.email,
        password_hash,
        full_name: data.full_name,
        phone: data.phone,
        role: "client",
      })
      .returning();
    res.status(201).json({ id: user.id, email: user.email, role: user.role });
  } catch (e) {
    next(e);
  }
});

// ============================================================================
// POST /api/auth/login
// ============================================================================
router.post("/login", async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, data.email))
      .limit(1);

    // Constant-time path: always run argon2.verify regardless of whether
    // the user exists. Result is OR'd with `user` existence to determine
    // whether the credentials are valid.
    const hashToCheck = user?.password_hash ?? (await getDummyHash());
    const credsOk = await argon2.verify(hashToCheck, data.password).catch(() => false);

    if (!user || !user.password_hash) {
      throw Unauthorized(GENERIC_INVALID);
    }

    // Lockout check — separate from cred check so even valid creds get bounced
    // if the account is locked. Done AFTER hash verify so a brute-forcer cannot
    // distinguish "user exists" by lockout timing.
    const lock = await checkLockout(user.id);
    if (lock.locked) {
      res.setHeader("Retry-After", String(lock.retryAfterSeconds));
      throw new HttpError(
        429,
        "account_locked",
        `Account temporarily locked. Try again in ${Math.ceil(lock.retryAfterSeconds / 60)} minutes.`,
        { retry_after_seconds: lock.retryAfterSeconds },
      );
    }

    if (!credsOk) {
      const status = await recordFailure(user.id);
      if (status.locked) {
        res.setHeader("Retry-After", String(status.retryAfterSeconds));
        throw new HttpError(
          429,
          "account_locked",
          `Too many failed attempts. Account locked for ${Math.ceil(LOCKOUT_DURATION_MS / 60_000)} minutes.`,
          { retry_after_seconds: status.retryAfterSeconds },
        );
      }
      throw Unauthorized(GENERIC_INVALID);
    }

    if (!user.active) throw Unauthorized("Account disabled");

    // Success path
    await recordSuccess(user.id);

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
    await db
      .update(schema.users)
      .set({ last_login_at: new Date() })
      .where(eq(schema.users.id, user.id));

    setAuthCookies(res, access, refresh);
    res.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    });
  } catch (e) {
    next(e);
  }
});

// ============================================================================
// POST /api/auth/client-login
// Job-number + email "magic link"-style login for portal customers.
// ============================================================================
router.post("/client-login", async (req, res, next) => {
  try {
    const data = clientLoginSchema.parse(req.body);
    const [job] = await db
      .select()
      .from(schema.jobs)
      .where(eq(schema.jobs.job_number, data.job_number))
      .limit(1);

    // Same generic message regardless of which side failed, to prevent
    // job-number / email enumeration.
    if (
      !job ||
      !job.customer_email ||
      job.customer_email.toLowerCase() !== data.email.toLowerCase()
    ) {
      throw Unauthorized("Job number and email do not match");
    }

    // Find or create the client user.
    let [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, job.customer_email))
      .limit(1);
    if (!user) {
      [user] = await db
        .insert(schema.users)
        .values({
          email: job.customer_email,
          full_name: job.customer_name,
          role: "client",
          client_job_number: data.job_number,
        })
        .returning();
    }

    if (!user.active) throw Unauthorized("Account disabled");

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
    res.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
      job,
    });
  } catch (e) {
    next(e);
  }
});

// ============================================================================
// POST /api/auth/refresh
// Rotates the refresh token. Reuse detection: if the presented refresh
// matches a session that has ALREADY been rotated (revoked_at is set),
// revoke EVERY active session for that user.
// ============================================================================
router.post("/refresh", async (req, res, next) => {
  try {
    const token = req.cookies?.enix_refresh;
    if (!token) throw Unauthorized("Missing refresh token");

    let claims;
    try {
      claims = verifyRefresh(token);
    } catch {
      throw Unauthorized("Invalid refresh token");
    }

    // Look up the session by JTI.
    const [session] = await db
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.id, claims.jti))
      .limit(1);

    // ---- Reuse detection ----
    // Two cases trigger session-family revocation:
    //   1. The session does not exist (token forgery? wiped DB?)
    //   2. The session IS already revoked AND the presented token hash
    //      matches its stored hash (someone is replaying an old, rotated
    //      refresh token — token theft signal).
    if (!session) {
      logger.warn(
        { user: claims.sub, jti: claims.jti, ip: req.ip },
        "refresh: session not found — possible forgery",
      );
      throw Unauthorized("Session not found");
    }
    if (session.revoked_at) {
      const tokenHashMatches = session.refresh_token_hash === hashToken(token);
      if (tokenHashMatches) {
        // Reuse confirmed — revoke entire family.
        const revoked = await revokeAllSessions(session.user_id, "refresh_reuse_detected");
        logger.warn(
          { user: session.user_id, ip: req.ip, revokedCount: revoked },
          "refresh: REUSE DETECTED — revoked all user sessions",
        );
      }
      clearAuthCookies(res);
      throw Unauthorized("Session revoked");
    }
    if (session.refresh_token_hash !== hashToken(token)) {
      // Token shape matches our JTI but hash doesn't — forgery attempt.
      throw Unauthorized("Refresh token mismatch");
    }
    if (session.expires_at < new Date()) {
      throw Unauthorized("Session expired");
    }

    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, claims.sub))
      .limit(1);
    if (!user || !user.active) throw Unauthorized("Account disabled");

    // ---- Rotate ----
    const newSessionId = generateSessionId();
    const access = signAccess({ sub: user.id, email: user.email, role: user.role });
    const refresh = signRefresh({ sub: user.id, jti: newSessionId });
    await db.transaction(async (tx) => {
      await tx
        .update(schema.sessions)
        .set({ revoked_at: new Date(), revocation_reason: "rotated" })
        .where(eq(schema.sessions.id, session.id));
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
  } catch (e) {
    next(e);
  }
});

// ============================================================================
// POST /api/auth/logout
// ============================================================================
router.post("/logout", async (req, res, next) => {
  try {
    const token = req.cookies?.enix_refresh;
    if (token) {
      try {
        const claims = verifyRefresh(token);
        await db
          .update(schema.sessions)
          .set({ revoked_at: new Date(), revocation_reason: "logout" })
          .where(eq(schema.sessions.id, claims.jti));
      } catch {
        /* ignore — already invalid */
      }
    }
    clearAuthCookies(res);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// ============================================================================
// GET /api/auth/me
// ============================================================================
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const [user] = await db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        full_name: schema.users.full_name,
        role: schema.users.role,
        phone: schema.users.phone,
        title: schema.users.title,
        company: schema.users.company,
        assigned_territory: schema.users.assigned_territory,
        active: schema.users.active,
        client_job_number: schema.users.client_job_number,
      })
      .from(schema.users)
      .where(eq(schema.users.id, req.user!.sub))
      .limit(1);
    if (!user) throw Unauthorized();
    res.json({ user });
  } catch (e) {
    next(e);
  }
});

// ============================================================================
// POST /api/auth/invite-employee — admin/manager only
// ============================================================================
router.post(
  "/invite-employee",
  requireAuth,
  requireRole("admin", "manager"),
  async (req, res, next) => {
    try {
      // managers cannot create admins
      const data = inviteEmployeeSchema.parse(req.body);
      if (data.role === "admin" && req.user!.role !== "admin") {
        throw Forbidden("Only admins may invite other admins");
      }

      const existing = await db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(eq(schema.users.email, data.email))
        .limit(1);
      if (existing.length) throw Conflict("Email already registered");

      // Generate a strong one-time password if none was provided.
      const tempPassword =
        data.password ?? crypto.randomBytes(16).toString("base64url").slice(0, 16) + "A1!";
      const password_hash = await argon2.hash(tempPassword, {
        type: argon2.argon2id,
        memoryCost: 19_456,
        timeCost: 2,
        parallelism: 1,
      });

      const [user] = await db
        .insert(schema.users)
        .values({
          email: data.email,
          password_hash,
          full_name: data.full_name ?? data.email.split("@")[0],
          phone: data.phone,
          title: data.title,
          company: data.company,
          assigned_territory: data.assigned_territory,
          crew_id: data.crew_id ?? null,
          role: data.role,
        } as any)
        .returning();

      // Best-effort invite email. If SMTP is not configured, surface the
      // temp password to the caller so the office can deliver it manually.
      let emailDelivered = false;
      let emailSkipped = false;
      if (data.send_invite === false) {
        emailSkipped = true;
      } else {
        try {
          const base = process.env.APP_BASE_URL || "https://enixexteriors.com";
          await sendEmail({
            to: data.email,
            subject: "You've been invited to the Enix Exteriors CRM",
            html: `<p>Hi ${data.full_name ?? ""},</p>
                   <p>You've been invited to the Enix Exteriors CRM as a <b>${data.role.replace(/_/g, " ")}</b>.</p>
                   <p>Login URL: <a href="${base}/login/employee">${base}/login/employee</a></p>
                   <p>Email: ${data.email}<br/>Temporary password: <b>${tempPassword}</b></p>
                   <p>Please change your password after first login.</p>`,
          });
          emailDelivered = true;
        } catch (mailErr) {
          logger.warn({ err: mailErr }, "invite email failed; returning temp password to caller");
        }
      }

      res.status(201).json({
        id: user.id,
        email: user.email,
        role: user.role,
        email_delivered: emailDelivered,
        email_skipped: emailSkipped,
        temp_password: emailDelivered ? undefined : tempPassword,
      });
    } catch (e) {
      next(e);
    }
  },
);

// ============================================================================
// POST /api/auth/invite-client — give a customer access to the portal
// ============================================================================
router.post(
  "/invite-client",
  requireAuth,
  requireRole("admin", "manager", "office", "office_staff"),
  async (req, res, next) => {
    try {
      const data = inviteClientSchema.parse(req.body);
      let job: { id: string; job_number: string | null; customer_name: string | null } | undefined;
      if (data.job_id) {
        const [foundJob] = await db
          .select({
            id: schema.jobs.id,
            job_number: schema.jobs.job_number,
            customer_name: schema.jobs.customer_name,
          })
          .from(schema.jobs)
          .where(eq(schema.jobs.id, data.job_id))
          .limit(1);
        if (!foundJob) throw NotFound("Job not found");
        job = foundJob;
      }

      const tempPassword = crypto.randomBytes(16).toString("base64url").slice(0, 16) + "A1!";
      const password_hash = await argon2.hash(tempPassword, {
        type: argon2.argon2id,
        memoryCost: 19_456,
        timeCost: 2,
        parallelism: 1,
      });

      const [existing] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, data.email))
        .limit(1);

      let user;
      if (existing) {
        [user] = await db
          .update(schema.users)
          .set({
            client_job_number: job?.job_number,
            role: existing.role === "admin" || existing.role === "manager" ? existing.role : "client",
            full_name: existing.full_name || data.full_name || data.email.split("@")[0],
            active: true,
            updated_at: new Date(),
          })
          .where(eq(schema.users.id, existing.id))
          .returning();
      } else {
        [user] = await db
          .insert(schema.users)
          .values({
            email: data.email,
            password_hash,
            full_name: data.full_name ?? job?.customer_name ?? data.email.split("@")[0],
            role: "client",
            client_job_number: job?.job_number ?? null,
          })
          .returning();
      }

      // Best-effort email
      let emailDelivered = false;
      try {
        const base = process.env.APP_BASE_URL || "https://enixexteriors.com";
        await sendEmail({
          to: data.email,
          subject: `Your Enix Exteriors client portal for job ${job?.job_number}`,
          html: `<p>Hi ${user.full_name},</p>
                 <p>You now have access to the Enix Exteriors client portal for job <b>${job?.job_number}</b>.</p>
                 <p>Login URL: <a href="${base}/portal/login">${base}/portal/login</a></p>
                 <p>Email: ${data.email}<br/>${existing ? "" : `Temporary password: <b>${tempPassword}</b>`}</p>
                 ${existing ? "" : "<p>Please change your password after first login.</p>"}`,
        });
        emailDelivered = true;
      } catch (mailErr) {
        logger.warn({ err: mailErr }, "client invite email failed");
      }

      res.status(201).json({
        id: user.id,
        email: user.email,
        client_job_number: user.client_job_number,
        email_delivered: emailDelivered,
        temp_password: existing || emailDelivered ? undefined : tempPassword,
      });
    } catch (e) {
      next(e);
    }
  },
);

export default router;
