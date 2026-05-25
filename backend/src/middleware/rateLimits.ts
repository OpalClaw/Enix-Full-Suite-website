import rateLimit, { type Options } from "express-rate-limit";
import type { Request } from "express";

const minutes = (n: number) => n * 60 * 1000;

function isProd() {
  return process.env.NODE_ENV === "production";
}

/** Common keyGenerator that prefers x-request-id+ip combo, falls back to ip. */
function keyByIp(req: Request) {
  return (req.ip ?? "unknown") + ":" + (req.headers["user-agent"] ?? "").slice(0, 64);
}

const baseOpts: Partial<Options> = {
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skipFailedRequests: false,
  skipSuccessfulRequests: false,
  // Sane Retry-After header is included by express-rate-limit when configured.
};

/**
 * Strict auth limiter — login, register, refresh, client-login.
 * Tighter than data routes; failed auth attempts should not flood the DB.
 * 10 req/min in production, 100/min in development.
 */
export const authLimiter = rateLimit({
  ...baseOpts,
  windowMs: minutes(1),
  max: isProd() ? 10 : 100,
  message: { error: "rate_limited", scope: "auth" },
  keyGenerator: keyByIp,
});

/**
 * Public lead intake limiter — applied to the public POST /api/leads.
 * 5 / 10 min per IP in production, 50 / min in development.
 */
export const publicWriteLimiter = rateLimit({
  ...baseOpts,
  windowMs: isProd() ? minutes(10) : minutes(1),
  max: isProd() ? 5 : 50,
  message: { error: "rate_limited", scope: "public_write" },
  keyGenerator: keyByIp,
});

/** General authenticated data-route limiter — 200 req/min. */
export const dataLimiter = rateLimit({
  ...baseOpts,
  windowMs: minutes(1),
  max: isProd() ? 200 : 1000,
  message: { error: "rate_limited", scope: "data" },
  keyGenerator: keyByIp,
});

/** Document/PDF generation — expensive; tighter cap. */
export const docGenLimiter = rateLimit({
  ...baseOpts,
  windowMs: minutes(1),
  max: isProd() ? 20 : 200,
  message: { error: "rate_limited", scope: "doc_gen" },
  keyGenerator: keyByIp,
});
