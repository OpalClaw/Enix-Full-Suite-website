// =============================================================================
// Enix API — main HTTP entrypoint
// =============================================================================
// Wiring order is deliberate:
//   1. Trust proxy + disable x-powered-by         (must precede any header logic)
//   2. Helmet + permissions-policy + COOP/HSTS    (security headers on every response)
//   3. Correlation ID                              (must come before logging/errors)
//   4. CORS allowlist (no wildcard)
//   5. Body parsing with 1MB cap
//   6. Cookie parsing
//   7. Pino request logger
//   8. Health + version (cheap, before auth-y routes)
//   9. /api/* routers
//  10. 404 then errorHandler (must be LAST)
// =============================================================================

import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";

import { logger } from "./utils/logger.js";
import { pool } from "./db/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { correlationId } from "./middleware/correlation.js";
import { securityHeaders } from "./middleware/securityHeaders.js";

import authRouter from "./routes/auth.js";
import publicLeadsRouter from "./routes/public_leads.js";
import leadsRouter from "./routes/leads.js";
import jobsRouter from "./routes/jobs.js";
import customersRouter from "./routes/customers.js";
import estimatesRouter from "./routes/estimates.js";
import invoicesRouter from "./routes/invoices.js";
import smartdocsRouter from "./routes/smartdocs.js";
import tasksRouter from "./routes/tasks.js";
import appointmentsRouter from "./routes/appointments.js";
import messagesRouter from "./routes/messages.js";
import warrantiesRouter from "./routes/warranties.js";
import inspectionsRouter from "./routes/inspections.js";
import contractsRouter from "./routes/contracts.js";
import proposalsRouter from "./routes/proposals.js";
import crewsRouter from "./routes/crews.js";
import usersRouter from "./routes/users.js";
import materialsRouter from "./routes/materials.js";
import activityRouter from "./routes/activity.js";
import insuranceClaimsRouter from "./routes/insurance_claims.js";
import reviewsRouter from "./routes/reviews.js";
import paymentsRouter from "./routes/payments.js";
import settingsRouter from "./routes/settings.js";

const app = express();

// ---- 1. Trust proxy (we're behind Nginx / Cloudflare) ----
app.set("trust proxy", 1);
app.disable("x-powered-by");

// ---- 2. Security headers ----
for (const mw of securityHeaders()) {
  app.use(mw as express.RequestHandler);
}

// ---- 3. Correlation ID ----
app.use(correlationId);

// ---- 4. CORS allowlist ----
const allowed = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
if (allowed.length === 0 && process.env.NODE_ENV === "production") {
  logger.error("CORS_ORIGINS is empty in production — refusing to start");
  process.exit(1);
}

const allowedMatchers = allowed.map((entry) => {
  if (entry.includes("*")) {
    const pattern = entry
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, "[^./]+");
    return { exact: null as string | null, regex: new RegExp(`^${pattern}$`) };
  }
  return { exact: entry, regex: null as RegExp | null };
});

function originAllowed(origin: string): boolean {
  for (const m of allowedMatchers) {
    if (m.exact !== null && m.exact === origin) return true;
    if (m.regex !== null && m.regex.test(origin)) return true;
  }
  return false;
}

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (originAllowed(origin)) return cb(null, true);
      cb(new Error("origin_not_allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    maxAge: 600,
  }),
);

// ---- 5. Body parsing with 1MB cap ----
app.use(express.json({ limit: "1mb", strict: true }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

// ---- 6. Cookie parsing ----
app.use(cookieParser());

// ---- 7. Pino request logger (binds correlation ID into log lines) ----
// pino-http v11 introduced strict typing on `logger` that doesn't accept a
// generic Logger; cast to satisfy the type checker. Runtime behavior unchanged.
app.use(
  pinoHttp({
    logger,
    genReqId: (req: IncomingMessage & { correlationId?: string }) => {
      const id = req.correlationId;
      return id ?? randomUUID();
    },
    customLogLevel: (_req: IncomingMessage, res: ServerResponse, err?: Error) => {
      if (err || res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
    customSuccessMessage: (req: IncomingMessage, res: ServerResponse) =>
      `${req.method} ${req.url} -> ${res.statusCode}`,
    customErrorMessage: (req: IncomingMessage, res: ServerResponse, err: Error) =>
      `${req.method} ${req.url} -> ${res.statusCode} (${err.message})`,
    serializers: {
      req: (req: { id: string; method: string; url: string; headers: Record<string, unknown> }) => ({
        id: req.id,
        method: req.method,
        url: req.url,
        // Note: pino global redact handles authorization/cookie headers already.
      }),
    },
  } as unknown as Parameters<typeof pinoHttp>[0]),
);

// ---- 8. Health & version ----
app.get("/api/health", async (_req, res) => {
  const started = Date.now();
  try {
    await pool.query("SELECT 1");
    res.json({
      status: "ok",
      db: "ok",
      uptime: process.uptime(),
      check_ms: Date.now() - started,
    });
  } catch (e) {
    res.status(503).json({
      status: "degraded",
      db: "down",
      message: (e as Error).message,
    });
  }
});

app.get("/api/version", (_req, res) => {
  res.json({
    name: "enix-api",
    version: process.env.npm_package_version || "1.0.0",
    node: process.version,
    env: process.env.NODE_ENV || "development",
  });
});

// ---- 9. Routes ----
app.use("/api/auth", authRouter);
app.use("/api/public", publicLeadsRouter);
app.use("/api/leads", leadsRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/customers", customersRouter);
app.use("/api/estimates", estimatesRouter);
app.use("/api/invoices", invoicesRouter);
app.use("/api/smartdocs", smartdocsRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/appointments", appointmentsRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/warranties", warrantiesRouter);
app.use("/api/inspections", inspectionsRouter);
app.use("/api/contracts", contractsRouter);
app.use("/api/proposals", proposalsRouter);
app.use("/api/crews", crewsRouter);
app.use("/api/users", usersRouter);
app.use("/api/materials", materialsRouter);
app.use("/api/activity", activityRouter);
app.use("/api/insurance-claims", insuranceClaimsRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/settings", settingsRouter);

// ---- 10. 404 + error handlers (MUST be last) ----
app.use(notFoundHandler);
app.use(errorHandler);

const port = Number(process.env.PORT || 3001);
const server = app.listen(port, () => {
  logger.info(
    {
      port,
      env: process.env.NODE_ENV || "development",
      node: process.version,
      cors_origins: allowed.length,
    },
    "enix-api listening",
  );
});

// ---- Graceful shutdown ----
let shuttingDown = false;
function shutdown(signal: string): void {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "shutting down — closing connections");
  // Stop accepting new connections; let in-flight requests finish (up to 10s).
  server.close(async () => {
    try {
      await pool.end();
      logger.info("pg pool closed");
    } catch (e) {
      logger.error({ err: e }, "error closing pg pool");
    }
    process.exit(0);
  });
  // Hard-kill after 10s if requests are still in flight.
  setTimeout(() => {
    logger.warn("forced exit after 10s grace period");
    process.exit(1);
  }, 10_000).unref();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "uncaught exception");
  shutdown("uncaughtException");
});
process.on("unhandledRejection", (reason) => {
  logger.fatal({ reason }, "unhandled rejection");
  shutdown("unhandledRejection");
});

export { app, server };
