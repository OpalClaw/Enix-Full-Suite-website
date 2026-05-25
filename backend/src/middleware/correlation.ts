import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

declare module "express-serve-static-core" {
  interface Request {
    correlationId?: string;
  }
}

/**
 * Attach a correlation ID to every request. Echoes an incoming
 * `x-request-id` if one is provided (trust-but-validate: must be
 * shape-safe and ≤128 chars), otherwise generates a fresh UUIDv4.
 *
 * The ID is set on `req.correlationId`, the `x-request-id` response
 * header, and included in every error response body so support can
 * correlate user-visible errors with server logs.
 */
const SAFE_ID = /^[A-Za-z0-9._\-]{1,128}$/;

export function correlationId(req: Request, res: Response, next: NextFunction) {
  const incoming = req.header("x-request-id");
  const id = incoming && SAFE_ID.test(incoming) ? incoming : randomUUID();
  req.correlationId = id;
  res.setHeader("x-request-id", id);
  next();
}
