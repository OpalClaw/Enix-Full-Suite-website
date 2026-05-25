// =============================================================================
// /api/public/lead and /api/public/lead-export
// =============================================================================
// Public lead-intake endpoints, consolidated into the backend service so the
// whole platform runs on a single hosted HTTP slot. Mirrors the standalone
// leads-api Hono handlers exactly — same Zod schema, same CSV escaping, same
// honeypot + UA bot detection + write mutex.

import { Router, type Request, type Response } from "express";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const router = Router();

// -----------------------------------------------------------------------------
// Storage (atomic write + in-process mutex)
// -----------------------------------------------------------------------------
function leadsPath(): string {
  return process.env.LEADS_FILE ?? "/home/workspace/.enix-leads/leads.json";
}

let writeLock: Promise<void> = Promise.resolve();

async function readAllLeads(): Promise<unknown[]> {
  try {
    const raw = await fs.readFile(leadsPath(), "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }
}

async function appendLead(lead: Record<string, unknown>): Promise<{ total: number }> {
  const run = async () => {
    const file = leadsPath();
    await fs.mkdir(path.dirname(file), { recursive: true });
    const list = await readAllLeads();
    list.push(lead);
    const tmp = `${file}.tmp-${randomUUID()}`;
    await fs.writeFile(tmp, JSON.stringify(list, null, 2), { mode: 0o600 });
    await fs.rename(tmp, file);
    return { total: list.length };
  };
  const prev = writeLock;
  let release!: () => void;
  writeLock = new Promise<void>((r) => (release = r));
  try {
    await prev;
    return await run();
  } finally {
    release();
  }
}

// -----------------------------------------------------------------------------
// Schema (strict — rejects unknown fields)
// -----------------------------------------------------------------------------
const sanitize = (s: string) =>
  s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

const trimmed = (max: number) =>
  z
    .string()
    .max(max)
    .transform((s) => sanitize(s.trim()));

const leadIntakeSchema = z
  .object({
    name: trimmed(120),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .max(254)
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
    phone: trimmed(40),
    service: trimmed(120).optional().default(""),
    // Extended fields (sent by the React public LeadForm).
    property_type: trimmed(50).optional().default(""),
    address: trimmed(255).optional().default(""),
    city: trimmed(100).optional().default(""),
    state: trimmed(8).optional().default(""),
    zip: trimmed(20).optional().default(""),
    message: trimmed(2000).optional().default(""),
    source: trimmed(80).optional().default(""),
    photo_urls: z.array(trimmed(500)).max(20).optional().default([]),
    // UTM tracking
    utm_source: trimmed(80).optional().default(""),
    utm_medium: trimmed(80).optional().default(""),
    utm_campaign: trimmed(80).optional().default(""),
    // Honeypot + consent
    website: trimmed(120).optional().default(""),
    tcpaConsent: z.boolean().optional().default(false),
  })
  .strict();

// -----------------------------------------------------------------------------
// CSV (OWASP formula-injection safe)
// -----------------------------------------------------------------------------
const DANGEROUS_PREFIXES = ["=", "+", "-", "@", "\t", "\r"];
function escapeCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  let s = String(v);
  if (s.length > 0 && DANGEROUS_PREFIXES.includes(s[0])) s = "'" + s;
  if (/[",\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const lines = [
    headers.map(escapeCell).join(","),
    ...rows.map((r) => headers.map((h) => escapeCell(r[h])).join(",")),
  ];
  return lines.join("\r\n");
}

// -----------------------------------------------------------------------------
// Bot detection
// -----------------------------------------------------------------------------
const BOT_UA = /(bot|crawl|spider|scrape|curl|wget|python-requests|libwww)/i;

// -----------------------------------------------------------------------------
// POST /api/public/lead
// -----------------------------------------------------------------------------
router.post("/lead", async (req: Request, res: Response) => {
  const ua = String(req.headers["user-agent"] ?? "");
  if (BOT_UA.test(ua)) {
    return res.json({ ok: true, stored: false, reason: "bot_ua" });
  }
  const parsed = leadIntakeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({
      error: "validation_failed",
      details: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }
  const data = parsed.data;
  const honeypot = typeof data.website === "string" ? data.website : "";
  if (honeypot.length > 0) {
    return res.json({ ok: true, stored: false, reason: "honeypot" });
  }
  if (!data.tcpaConsent) {
    return res.status(422).json({ error: "tcpa_required" });
  }
  const lead = {
    id: randomUUID(),
    received_at: new Date().toISOString(),
    ip: req.ip ?? "",
    user_agent: ua.slice(0, 200),
    ...data,
  };
  try {
    const { total } = await appendLead(lead);
    return res.json({ ok: true, stored: true, lead_id: lead.id, total });
  } catch (e) {
    req.log?.error({ err: e }, "lead store failed");
    return res.status(500).json({ error: "storage_failed" });
  }
});

// -----------------------------------------------------------------------------
// GET /api/public/lead-export?format=csv
// -----------------------------------------------------------------------------
function constantTimeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  const len = Math.max(aBuf.length, bBuf.length, 1);
  const aPad = Buffer.concat([aBuf, Buffer.alloc(len - aBuf.length)]);
  const bPad = Buffer.concat([bBuf, Buffer.alloc(len - bBuf.length)]);
  const eq = timingSafeEqual(aPad, bPad);
  return eq && aBuf.length === bBuf.length;
}

router.get("/lead-export", async (req: Request, res: Response) => {
  const expected = process.env.ENIX_LEADS_EXPORT_TOKEN;
  if (!expected) return res.status(401).json({ error: "unauthorized" });
  const auth = String(req.headers["authorization"] ?? "");
  if (!auth.startsWith("Bearer ")) return res.status(401).json({ error: "unauthorized" });
  const token = auth.slice(7);
  if (!constantTimeEqual(token, expected)) {
    return res.status(401).json({ error: "unauthorized" });
  }
  const leads = (await readAllLeads()) as Record<string, unknown>[];
  res.setHeader("Cache-Control", "no-store");
  if (req.query.format === "csv") {
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="enix-leads.csv"');
    return res.send(toCSV(leads));
  }
  return res.json({
    count: leads.length,
    exported_at: new Date().toISOString(),
    leads,
  });
});

export default router;
