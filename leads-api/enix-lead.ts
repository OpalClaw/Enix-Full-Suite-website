// =============================================================================
// Zo Space API route — POST /api/enix-lead
// =============================================================================
// Public lead intake. Hardened against spam:
//   • Strict CORS allowlist
//   • Per-IP rate limit (5 / 10 min)
//   • Honeypot field "website"
//   • Bot UA detection
//   • TCPA consent required
//   • Email / phone shape validation
//
// Storage: appends JSON records to `LEADS_FILE` (default /home/workspace/Documents/Enix/leads.json).
//
// Deploy by uploading to a Zo Space at path /api/enix-lead, or adapt c.req/c.json
// to Express req/res — the logic is platform-agnostic.

import type { Context } from "hono";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const LEADS_FILE = process.env.LEADS_FILE || "/home/workspace/Documents/Enix/leads.json";

const ALLOWED_ORIGINS = new Set<string>([
  "https://enixexteriors.com",
  "https://www.enixexteriors.com",
  // Add staging/preview origins as needed
]);

function corsHeaders(origin: string | undefined) {
  const allow = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://enixexteriors.com";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 5;
const rateState = new Map<string, { count: number; reset: number }>();

function checkRate(ip: string): boolean {
  const now = Date.now();
  const cur = rateState.get(ip);
  if (!cur || now > cur.reset) {
    rateState.set(ip, { count: 1, reset: now + RATE_WINDOW_MS });
    return true;
  }
  if (cur.count >= RATE_MAX) return false;
  cur.count += 1;
  return true;
}

function looksLikeBot(ua: string, hp: string): boolean {
  if (hp) return true;
  const u = ua.toLowerCase();
  if (!u) return true;
  return /headless|phantomjs|slurp|crawler|spider|wget|curl|python-requests|scrapy/.test(u);
}

function sanitize(value: unknown, max = 500): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);
}

async function readLeads(): Promise<any[]> {
  try {
    const data = await fs.readFile(LEADS_FILE, "utf8");
    return JSON.parse(data);
  } catch { return []; }
}

async function writeLeads(leads: any[]) {
  await fs.mkdir(path.dirname(LEADS_FILE), { recursive: true });
  await fs.writeFile(LEADS_FILE, JSON.stringify(leads, null, 2), "utf8");
}

export default async (c: Context) => {
  const origin = c.req.header("origin");
  const cors = corsHeaders(origin);
  for (const [k, v] of Object.entries(cors)) c.header(k, v);

  if (c.req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (c.req.method !== "POST") return c.json({ error: "method_not_allowed" }, 405);
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return c.json({ error: "origin_not_allowed" }, 403);

  const ip =
    c.req.header("cf-connecting-ip") ||
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    c.req.header("x-real-ip") ||
    "unknown";
  if (!checkRate(ip)) return c.json({ error: "rate_limited", retry_after_seconds: 600 }, 429);

  let raw: any;
  try { raw = await c.req.json(); }
  catch { return c.json({ error: "invalid_json" }, 400); }

  const honeypot = sanitize(raw.website ?? "", 200);
  const userAgent = c.req.header("user-agent") || "";
  if (looksLikeBot(userAgent, honeypot)) {
    return c.json({ ok: true, stored: true, lead_id: randomUUID() });
  }

  const lead = {
    id: randomUUID(),
    received_at: new Date().toISOString(),
    notified: false,
    notified_at: null,
    name: sanitize(raw.name, 120),
    email: sanitize(raw.email, 180),
    phone: sanitize(raw.phone, 40),
    service: sanitize(raw.service, 80),
    property_type: sanitize(raw.property_type, 40),
    address: sanitize(raw.address, 200),
    city: sanitize(raw.city, 100),
    state: sanitize(raw.state, 50),
    zip: sanitize(raw.zip, 10),
    message: sanitize(raw.message, 2000),
    source: sanitize(raw.source, 80) || "website",
    tcpaConsent: !!raw.tcpaConsent,
    photo_count: Array.isArray(raw.photo_urls) ? raw.photo_urls.length : 0,
    ip,
    user_agent: userAgent,
    referer: c.req.header("referer") || "",
  };

  if (!lead.name && !lead.email && !lead.phone) return c.json({ error: "missing_contact_info" }, 400);
  if (lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) return c.json({ error: "invalid_email" }, 422);
  if (lead.phone && (lead.phone.match(/\d/g) || []).length < 7) return c.json({ error: "invalid_phone" }, 422);
  if (!lead.tcpaConsent) return c.json({ error: "tcpa_consent_required" }, 400);

  const leads = await readLeads();
  leads.push(lead);
  await writeLeads(leads);

  return c.json({ ok: true, stored: true, lead_id: lead.id });
};
