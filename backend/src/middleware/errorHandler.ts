import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { HttpError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    logger.warn({ path: req.path, issues: err.issues }, "validation failed");
    return res.status(400).json({
      error: "validation_failed",
      message: "Request payload failed validation",
      details: err.issues.map(i => ({ path: i.path.join("."), message: i.message, code: i.code })),
    });
  }
  if (err instanceof HttpError) {
    logger.info({ path: req.path, status: err.status, code: err.code }, err.message);
    return res.status(err.status).json({ error: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) });
  }
  // Postgres errors
  const pgErr = err as { code?: string; detail?: string };
  if (pgErr?.code === "23505") {
    return res.status(409).json({ error: "conflict", message: "Duplicate value", detail: pgErr.detail });
  }
  if (pgErr?.code === "23503") {
    return res.status(409).json({ error: "fk_violation", message: "Referenced record not found", detail: pgErr.detail });
  }
  if (pgErr?.code === "23502") {
    return res.status(400).json({ error: "not_null_violation", message: "Required field missing", detail: pgErr.detail });
  }

  logger.error({ err, path: req.path }, "unhandled error");
  return res.status(500).json({ error: "internal_error", message: "Internal server error" });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "not_found", message: "Route not found" });
}
