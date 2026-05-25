// =============================================================================
// Zo Space API route — GET /api/enix-leads-export
// =============================================================================
// Admin-only export of the leads.json store. Bearer-auth required.
// Returns JSON by default, ?format=csv for CSV.
//
// REQUIRED ENV: ENIX_LEADS_EXPORT_TOKEN — opaque random hex string set in
// Zo Settings → Advanced → Secrets. Generate with `openssl rand -hex 32`.
//
//   curl -H "Authorization: Bearer $TOKEN" https://<host>/api/enix-leads-export
//   curl -H "Authorization: Bearer $TOKEN" "https://<host>/api/enix-leads-export?format=csv"
//
// Security:
//   • Constant-time token comparison (crypto.timingSafeEqual)
//   • CSV-injection escapes on every field (leading =, +, -, @, TAB, CR)
//   • Cache-Control: no-store
//   • CORS: no Origin header allowed — admin tooling only
// =============================================================================

import type { Context } from "hono";
import { timingSafeEqual } from "node:crypto";
import { readLeads } from "./src/store";
import { toCSV } from "./src/csv";

function constantTimeEq(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  // timingSafeEqual requires equal-length buffers — pad to the max length to
  // avoid leaking length info via the early return.
  if (ab.length !== bb.length) {
    // Still do a fixed-time compare against itself so the duration is constant.
    timingSafeEqual(ab, ab);
    return false;
  }
  return timingSafeEqual(ab, bb);
}

function requireAuth(c: Context): boolean {
  const secret = process.env.ENIX_LEADS_EXPORT_TOKEN;
  if (!secret || secret.length < 16) return false;
  const auth = c.req.header("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return false;
  return constantTimeEq(auth.slice(7), secret);
}

export default async (c: Context) => {
  if (!requireAuth(c)) {
    c.header("WWW-Authenticate", 'Bearer realm="enix-leads-export"');
    return c.json({ error: "unauthorized" }, 401);
  }

  let leads: Array<Record<string, unknown>> = [];
  try {
    leads = (await readLeads()) as unknown as Array<Record<string, unknown>>;
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code !== "ENOENT") {
      return c.json({ error: "read_failed", message: err.message }, 500);
    }
  }

  const format = c.req.query("format") ?? "json";
  if (format === "csv") {
    const csv = toCSV(leads);
    const filename = `enix-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  return c.json(
    { count: leads.length, exported_at: new Date().toISOString(), leads },
    200,
    { "Cache-Control": "no-store" },
  );
};
