// =============================================================================
// Central error handler
// =============================================================================
// Every error response includes:
//   • A stable machine code (`error`)
//   • A human message (`message`) — never leaks stack / internal IDs
//   • The correlation ID (`request_id`) so support can find the log line
//
// Errors classified:
//   • ZodError                 → 400 validation_failed
//   • HttpError (our class)    → its own .status / .code
//   • Postgres unique violation→ 409 conflict
//   • Postgres FK violation    → 409 fk_violation
//   • Postgres not-null        → 400 not_null_violation
//   • Anything else            → 500 internal_error (logged, not exposed)

import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { HttpError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

interface PgError {
  code?: string;
  detail?: string;
  schema?: string;
  table?: string;
  constraint?: string;
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = req.correlationId ?? "no-correlation-id";

  // ---- Zod validation ----
  if (err instanceof ZodError) {
    logger.warn(
      { request_id: requestId, path: req.path, issues: err.issues },
      "validation failed",
    );
    res.status(400).json({
      error: "validation_failed",
      message: "Request payload failed validation",
      request_id: requestId,
      details: err.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
        code: i.code,
      })),
    });
    return;
  }

  // ---- Our HttpError ----
  if (err instanceof HttpError) {
    // 4xx errors are logged at info/warn; 5xx at error.
    const level = err.status >= 500 ? "error" : "info";
    logger[level](
      { request_id: requestId, path: req.path, status: err.status, code: err.code },
      err.message,
    );
    res.status(err.status).json({
      error: err.code,
      message: err.message,
      request_id: requestId,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  // ---- Postgres errors ----
  const pgErr = err as PgError;
  if (pgErr?.code === "23505") {
    logger.warn({ request_id: requestId, detail: pgErr.detail }, "unique violation");
    res.status(409).json({
      error: "conflict",
      message: "Duplicate value",
      request_id: requestId,
    });
    return;
  }
  if (pgErr?.code === "23503") {
    logger.warn({ request_id: requestId, detail: pgErr.detail }, "fk violation");
    res.status(409).json({
      error: "fk_violation",
      message: "Referenced record not found",
      request_id: requestId,
    });
    return;
  }
  if (pgErr?.code === "23502") {
    logger.warn({ request_id: requestId, detail: pgErr.detail }, "not-null violation");
    res.status(400).json({
      error: "not_null_violation",
      message: "Required field missing",
      request_id: requestId,
    });
    return;
  }

  // ---- CORS rejection from cors() origin callback ----
  if ((err as Error)?.message === "origin_not_allowed") {
    res.status(403).json({
      error: "origin_not_allowed",
      message: "Origin not in allowlist",
      request_id: requestId,
    });
    return;
  }

  // ---- Unknown ----
  logger.error(
    { request_id: requestId, err, path: req.path },
    "unhandled error",
  );
  res.status(500).json({
    error: "internal_error",
    message: "Internal server error",
    request_id: requestId,
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: "not_found",
    message: "Route not found",
    request_id: req.correlationId ?? "no-correlation-id",
  });
}
