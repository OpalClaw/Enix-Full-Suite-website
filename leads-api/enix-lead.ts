// =============================================================================
// Zo Space API route — POST /api/enix-lead
// =============================================================================
// Public lead intake. Hardened against:
//   • Spam        — per-IP rate limit (in-process, sufficient for single Zo Space host)
//   • Bots        — honeypot field + UA filter
//   • Junk data   — Zod .strict() schema, prototype-pollution-safe
//   • CSV exfil   — every field is sanitized to printable text < length cap
//   • Race writes — leads.json writes are serialized + atomic via temp+rename
//   • CORS        — strict allowlist (no wildcard)
//   • DoS         — body size cap (MAX_BODY_BYTES) before parse
//   • TCPA        — explicit consent required at validation time
// =============================================================================

import type { Context } from "hono";
import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import { leadIntakeSchema } from "./src/schema";
import { appendLead, type LeadRecord } from "./src/store";
import { corsHeadersFor, isAllowedOrigin } from "./src/cors";

const MAX_BODY_BYTES = Number(process.env.MAX_BODY_BYTES || 65_536); // 64KB default
const RATE_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 600_000); // 10 min
const RATE_MAX = Number(process.env.RATE_LIMIT_MAX || 5);

const BOT_UA =
  /headless|phantomjs|slurp|crawler|spider|wget|curl|python-requests|scrapy|axios|httpclient|java-http-client|go-http-client/i;

// ---- In-process rate state ----
// Map<ip, { count, reset }>. Periodically pruned so it can't grow unbounded.
interface RateBucket {
  count: number;
  reset: number;
}
const rateState = new Map<string, RateBucket>();

function pruneRateState(now: number): void {
  // Cheap O(n) sweep — for the volumes a roofing form sees this is fine.
  if (rateState.size < 1024) return;
  for (const [ip, bucket] of rateState) {
    if (bucket.reset < now) rateState.delete(ip);
  }
}

function checkRate(ip: string): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  pruneRateState(now);
  const cur = rateState.get(ip);
  if (!cur || now > cur.reset) {
    rateState.set(ip, { count: 1, reset: now + RATE_WINDOW_MS });
    return { ok: true, retryAfter: 0 };
  }
  if (cur.count >= RATE_MAX) {
    return { ok: false, retryAfter: Math.ceil((cur.reset - now) / 1000) };
  }
  cur.count += 1;
  return { ok: true, retryAfter: 0 };
}

function clientIp(c: Context): string {
  return (
    c.req.header("cf-connecting-ip") ||
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    c.req.header("x-real-ip") ||
    "unknown"
  );
}

function looksLikeBot(ua: string, honeypot: string): boolean {
  if (honeypot && honeypot.trim().length > 0) return true;
  const u = (ua || "").toLowerCase();
  if (!u) return true; // empty UA on a public form = scripted client
  return BOT_UA.test(u);
}

function applyCors(c: Context, origin: string | undefined): void {
  for (const [k, v] of Object.entries(corsHeadersFor(origin))) c.header(k, v);
}

export default async (c: Context) => {
  const origin = c.req.header("origin");

  // -------- OPTIONS preflight --------
  if (c.req.method === "OPTIONS") {
    applyCors(c, origin);
    return new Response(null, { status: 204 });
  }

  applyCors(c, origin);

  if (c.req.method !== "POST") {
    return c.json({ error: "method_not_allowed" }, 405);
  }

  // Strict origin enforcement — no wildcard, no missing-origin loophole.
  if (!isAllowedOrigin(origin)) {
    return c.json({ error: "origin_not_allowed" }, 403);
  }

  // -------- Rate limit (per-IP) --------
  const ip = clientIp(c);
  const rl = checkRate(ip);
  if (!rl.ok) {
    c.header("Retry-After", String(rl.retryAfter));
    return c.json({ error: "rate_limited", retry_after_seconds: rl.retryAfter }, 429);
  }

  // -------- Payload-size cap (before parse) --------
  const contentLength = Number(c.req.header("content-length") || "0");
  if (contentLength > MAX_BODY_BYTES) {
    return c.json({ error: "payload_too_large", limit_bytes: MAX_BODY_BYTES }, 413);
  }

  // -------- Read + parse JSON safely --------
  let raw: unknown;
  try {
    // Hono's c.req.json() will read the body — but a hostile client could omit
    // content-length. Read raw and gate by byte length, then parse.
    const text = await c.req.text();
    if (text.length > MAX_BODY_BYTES) {
      return c.json({ error: "payload_too_large", limit_bytes: MAX_BODY_BYTES }, 413);
    }
    raw = JSON.parse(text);
  } catch {
    return c.json({ error: "invalid_json" }, 400);
  }

  // -------- Honeypot / bot UA gate --------
  // Inspect honeypot BEFORE strict-validation so silent-drop bots get a 200 OK.
  const honeypot =
    typeof (raw as Record<string, unknown> | null)?.website === "string"
      ? ((raw as Record<string, string>).website ?? "")
      : "";
  const userAgent = c.req.header("user-agent") || "";
  if (looksLikeBot(userAgent, honeypot)) {
    // Silently consume — never tell a bot it was caught.
    return c.json({ ok: true, stored: true, lead_id: randomUUID() });
  }

  // -------- Schema validation --------
  let data: ReturnType<typeof leadIntakeSchema.parse>;
  try {
    data = leadIntakeSchema.parse(raw);
  } catch (e) {
    if (e instanceof ZodError) {
      return c.json(
        {
          error: "validation_failed",
          details: e.issues.map((i) => ({
            path: i.path.join("."),
            code: i.code,
            message: i.message,
          })),
        },
        422,
      );
    }
    return c.json({ error: "validation_failed" }, 400);
  }

  // -------- Build canonical record --------
  const lead: LeadRecord = {
    id: randomUUID(),
    received_at: new Date().toISOString(),
    notified: false,
    notified_at: null,
    name: data.name,
    email: data.email,
    phone: data.phone,
    service: data.service ?? "",
    property_type: data.property_type ?? "",
    address: data.address ?? "",
    city: data.city ?? "",
    state: data.state ?? "",
    zip: data.zip ?? "",
    message: data.message ?? "",
    source: data.source ?? "website",
    tcpaConsent: data.tcpaConsent,
    photo_count: data.photo_urls?.length ?? 0,
    ip,
    user_agent: userAgent,
    referer: c.req.header("referer") || "",
  };

  // -------- Append (serialized + atomic) --------
  try {
    const { total, warn } = await appendLead(lead);
    if (warn) {
      // eslint-disable-next-line no-console
      console.warn(`[enix-lead] leads.json soft-limit exceeded: ${total} entries`);
    }
    return c.json({ ok: true, stored: true, lead_id: lead.id });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[enix-lead] append failed", e);
    return c.json({ error: "storage_failed" }, 500);
  }
};
