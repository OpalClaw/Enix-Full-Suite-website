import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import type { IncomingMessage, ServerResponse } from "node:http";

import { logger } from "./utils/logger.js";
import { pool } from "./db/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

import authRouter from "./routes/auth.js";
import leadsRouter from "./routes/leads.js";
import jobsRouter from "./routes/jobs.js";
import customersRouter from "./routes/customers.js";
import estimatesRouter from "./routes/estimates.js";
import invoicesRouter from "./routes/invoices.js";
import smartdocsRouter from "./routes/smartdocs.js";

const app = express();

// ---- Trust proxy (we're behind Nginx) ----
app.set("trust proxy", 1);
app.disable("x-powered-by");

// ---- Security ----
app.use(helmet({
  contentSecurityPolicy: false, // CSP is set on frontend
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// ---- CORS allowlist ----
const allowed = (process.env.CORS_ORIGINS || "")
  .split(",").map(s => s.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowed.includes(origin)) return cb(null, true);
    cb(new Error("origin_not_allowed"));
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  maxAge: 600,
}));

// ---- Body parsing ----
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(cookieParser());

// ---- Request logging ----
app.use(pinoHttp({
  logger,
  customLogLevel: (_req: IncomingMessage, res: ServerResponse, err?: Error) => {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
}));

// ---- Health & version ----
app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "ok", uptime: process.uptime() });
  } catch (e) {
    res.status(503).json({ status: "degraded", db: "down", message: (e as Error).message });
  }
});

app.get("/api/version", (_req, res) => {
  res.json({ name: "enix-api", version: "1.0.0", node: process.version });
});

// ---- Routes ----
app.use("/api/auth", authRouter);
app.use("/api/leads", leadsRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/customers", customersRouter);
app.use("/api/estimates", estimatesRouter);
app.use("/api/invoices", invoicesRouter);
app.use("/api/smartdocs", smartdocsRouter);

// ---- 404 + error handlers (must be last) ----
app.use(notFoundHandler);
app.use(errorHandler);

const port = Number(process.env.PORT || 3001);
const server = app.listen(port, () => {
  logger.info({ port }, "enix-api listening");
});

// ---- Graceful shutdown ----
function shutdown(signal: string) {
  logger.info({ signal }, "shutting down");
  server.close(async () => {
    try { await pool.end(); } catch { /* ignore */ }
    process.exit(0);
  });
  // hard-stop after 10s
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
