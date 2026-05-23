// =============================================================================
// Zo Space API route — GET /api/enix-leads-export
// =============================================================================
// Admin-only export of the leads.json database. Bearer-auth required.
// Returns JSON by default, ?format=csv for CSV.
//
// REQUIRED ENV: ENIX_LEADS_EXPORT_TOKEN — opaque random string, set in Zo Settings → Advanced → Secrets
// CALL: curl -H "Authorization: Bearer <token>" https://opalsage.zo.space/api/enix-leads-export[?format=csv]

import type { Context } from "hono";
import { promises as fs } from "node:fs";
import { timingSafeEqual } from "node:crypto";

const LEADS_FILE = process.env.LEADS_FILE || "/home/workspace/Documents/Enix/leads.json";

function constantTimeEq(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function requireAuth(c: Context): boolean {
  const secret = process.env.ENIX_LEADS_EXPORT_TOKEN;
  if (!secret) return false;
  const auth = c.req.header("authorization");
  if (!auth?.startsWith("Bearer ")) return false;
  return constantTimeEq(auth.slice(7), secret);
}

function toCSV(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return "";
  const headers = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const escape = (v: unknown): string => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [headers.join(",")];
  for (const row of rows) lines.push(headers.map((h) => escape(row[h])).join(","));
  return lines.join("\n");
}

export default async (c: Context) => {
  if (!requireAuth(c)) return c.json({ error: "unauthorized" }, 401);

  let leads: Array<Record<string, unknown>> = [];
  try {
    const raw = await fs.readFile(LEADS_FILE, "utf8");
    leads = JSON.parse(raw);
  } catch (e: any) {
    if (e.code !== "ENOENT") return c.json({ error: "read_failed", message: e.message }, 500);
  }

  const format = c.req.query("format") ?? "json";
  if (format === "csv") {
    const csv = toCSV(leads);
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="enix-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }
  return c.json({ count: leads.length, exported_at: new Date().toISOString(), leads });
};
