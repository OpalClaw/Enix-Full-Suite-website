// =============================================================================
// Account lockout & session-family revocation
// =============================================================================
// Lockout policy (configurable via env):
//   • After LOCKOUT_THRESHOLD failed login attempts within LOCKOUT_WINDOW_MS,
//     the account is locked for LOCKOUT_DURATION_MS.
//   • Successful login resets the failed counter.
//   • Counter is stored on the users table.
//
// Session-family revocation:
//   • When a refresh token is REUSED (a previously-rotated, hashed refresh
//     value comes back), this is a token-theft signal.
//   • We revoke EVERY non-revoked session for the user — not just the one
//     that was reused. The attacker either has the user's cookies or their
//     active session; either way, force re-authentication.
// =============================================================================

import { and, eq, isNull, sql } from "drizzle-orm";
import { db, schema } from "../db/index.js";

export const LOCKOUT_THRESHOLD = Number(process.env.LOCKOUT_THRESHOLD || 5);
export const LOCKOUT_WINDOW_MS = Number(process.env.LOCKOUT_WINDOW_MS || 15 * 60 * 1000);
export const LOCKOUT_DURATION_MS = Number(process.env.LOCKOUT_DURATION_MS || 15 * 60 * 1000);

export interface LockoutStatus {
  locked: boolean;
  retryAfterSeconds: number;
}

/**
 * Returns whether the user is currently locked out, and how many seconds
 * to retry after. Reads-only — does not mutate.
 */
export async function checkLockout(userId: string): Promise<LockoutStatus> {
  const [u] = await db
    .select({
      locked_until: schema.users.locked_until,
    })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);
  if (!u || !u.locked_until) return { locked: false, retryAfterSeconds: 0 };
  const remainingMs = u.locked_until.getTime() - Date.now();
  if (remainingMs <= 0) return { locked: false, retryAfterSeconds: 0 };
  return { locked: true, retryAfterSeconds: Math.ceil(remainingMs / 1000) };
}

/**
 * Record a failed login attempt for this user. If the threshold is hit
 * within the window, set `locked_until = now + LOCKOUT_DURATION_MS`.
 * Returns the updated lock status.
 */
export async function recordFailure(userId: string): Promise<LockoutStatus> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - LOCKOUT_WINDOW_MS);

  // Reset counter if the last failure was outside the window.
  const [u] = await db
    .select({
      failed_login_attempts: schema.users.failed_login_attempts,
      last_failed_login_at: schema.users.last_failed_login_at,
    })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);
  if (!u) return { locked: false, retryAfterSeconds: 0 };

  const lastFailed = u.last_failed_login_at;
  const insideWindow = lastFailed && lastFailed >= windowStart;
  const newCount = insideWindow ? (u.failed_login_attempts ?? 0) + 1 : 1;

  if (newCount >= LOCKOUT_THRESHOLD) {
    const lockedUntil = new Date(now.getTime() + LOCKOUT_DURATION_MS);
    await db
      .update(schema.users)
      .set({
        failed_login_attempts: newCount,
        last_failed_login_at: now,
        locked_until: lockedUntil,
      })
      .where(eq(schema.users.id, userId));
    return {
      locked: true,
      retryAfterSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
    };
  }

  await db
    .update(schema.users)
    .set({
      failed_login_attempts: newCount,
      last_failed_login_at: now,
    })
    .where(eq(schema.users.id, userId));
  return { locked: false, retryAfterSeconds: 0 };
}

/** Clear the failed counter and any lockout on successful login. */
export async function recordSuccess(userId: string): Promise<void> {
  await db
    .update(schema.users)
    .set({
      failed_login_attempts: 0,
      last_failed_login_at: null,
      locked_until: null,
    })
    .where(eq(schema.users.id, userId));
}

/**
 * Revoke every active session for this user. Used on refresh-token reuse
 * detection — a token-theft signal.
 */
export async function revokeAllSessions(userId: string, reason: string): Promise<number> {
  const result = await db
    .update(schema.sessions)
    .set({ revoked_at: new Date(), revocation_reason: reason })
    .where(and(eq(schema.sessions.user_id, userId), isNull(schema.sessions.revoked_at)))
    .returning({ id: schema.sessions.id });
  return result.length;
}

/** Periodic cleanup — remove sessions whose `expires_at` is older than 30 days past expiry. */
export async function cleanupExpiredSessions(): Promise<number> {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const result = await db
    .delete(schema.sessions)
    .where(sql`expires_at < ${cutoff.toISOString()}::timestamptz`)
    .returning({ id: schema.sessions.id });
  return result.length;
}
