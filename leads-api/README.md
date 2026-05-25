# Enix Leads-API

Two hardened public endpoints, deployable as Zo Space API routes (Bun +
Hono runtime). The website's lead form POSTs to `/api/enix-lead`; office
admins pull a CSV via `/api/enix-leads-export`.

[![Bun](https://img.shields.io/badge/Bun-%3E%3D1.1-black)](https://bun.sh)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](../LICENSE)

## Endpoints

### `POST /api/enix-lead` — public lead intake

**Request:**

```http
POST /api/enix-lead
Origin: https://enixexteriors.com
Content-Type: application/json

{
  "name": "Jane Roof",
  "email": "jane@example.com",
  "phone": "(865) 555-1234",
  "service": "Roofing",
  "property_type": "residential",
  "address": "123 Oak St",
  "city": "Knoxville",
  "state": "TN",
  "zip": "37919",
  "message": "Storm damage estimate please.",
  "source": "website",
  "tcpaConsent": true,
  "website": ""
}
```

**Responses:**

| Status | When |
| --- | --- |
| `200` | Lead accepted (or bot silently consumed) |
| `400` | Invalid JSON |
| `403` | Origin not in allowlist |
| `413` | Payload > `MAX_BODY_BYTES` |
| `422` | Schema validation failed |
| `429` | Rate limit (header: `Retry-After`) |
| `500` | Storage write failed |

**Security guarantees:**

- ✅ Strict CORS allowlist (no `*`)
- ✅ Per-IP rate limit (`5 / 600s` default)
- ✅ Honeypot field `website` — non-empty → silent drop
- ✅ Bot UA filter (curl, wget, scrapy, headless, …) → silent drop
- ✅ Zod `.strict()` schema rejects unknown fields (prototype-pollution defense)
- ✅ Phone min-7-digits, conservative email regex
- ✅ Control-character stripping on all string inputs
- ✅ TCPA consent required
- ✅ Payload size cap (`64 KB` default) **before** JSON parse
- ✅ Atomic + serialized writes to `leads.json` (temp-file + rename)

### `GET /api/enix-leads-export` — admin export

**Request:**

```http
GET /api/enix-leads-export?format=csv
Authorization: Bearer <ENIX_LEADS_EXPORT_TOKEN>
```

**Responses:**

| Status | When |
| --- | --- |
| `200` | JSON or CSV body |
| `401` | Missing / invalid bearer token |
| `500` | Read failed |

**Security guarantees:**

- ✅ Constant-time token comparison (`crypto.timingSafeEqual`)
- ✅ CSV-injection escapes — leading `=`, `+`, `-`, `@`, `\t`, `\r` are
  prefixed with `'` so spreadsheet apps render them as text
  ([OWASP](https://owasp.org/www-community/attacks/CSV_Injection))
- ✅ RFC-4180-compliant quoting for embedded commas, quotes, newlines
- ✅ `Cache-Control: no-store`
- ✅ `X-Content-Type-Options: nosniff`

## File layout

```
leads-api/
├── enix-lead.ts            # POST /api/enix-lead — Hono handler
├── enix-leads-export.ts    # GET  /api/enix-leads-export — Hono handler
├── src/
│   ├── cors.ts             # Strict allowlist (no wildcard)
│   ├── csv.ts              # RFC-4180 + OWASP-safe CSV
│   ├── schema.ts           # Zod .strict() lead-intake schema
│   └── store.ts            # Serialized append-only leads.json store
├── tests/
│   ├── csv.test.ts         # CSV-injection escapes
│   ├── schema.test.ts      # Strict-mode + validation
│   └── store.test.ts       # 100-concurrent-write race-safety test
├── package.json
├── tsconfig.json
└── .env.example
```

## Local development

```bash
bun install
bun run typecheck
bun test                   # 22 tests
bun --watch enix-lead.ts   # dev server
```

## Environment

| Variable | Required | Default | Purpose |
| --- | :-: | --- | --- |
| `LEADS_FILE` | | `/home/workspace/Documents/Enix/leads.json` | Where leads append |
| `ALLOWED_ORIGINS` | ✅ | (Enix domains) | Comma-separated allowlist |
| `ENIX_LEADS_EXPORT_TOKEN` | ✅ | — | Bearer secret for export |
| `RATE_LIMIT_MAX` | | `5` | Leads per window |
| `RATE_LIMIT_WINDOW_MS` | | `600000` | Window length (ms) |
| `MAX_BODY_BYTES` | | `65536` | Max request body (bytes) |
| `LEADS_SOFT_LIMIT` | | `10000` | Warn-log threshold on `leads.json` size |

Generate the export token:

```bash
openssl rand -hex 32
```

## Deploy — Zo Space

1. Save the contents of `enix-lead.ts` to a Zo Space API route at
   `/api/enix-lead`. Repeat for `enix-leads-export.ts` at
   `/api/enix-leads-export`.
2. Save the `src/*` modules alongside the route handlers (Zo Space honors
   relative ESM imports in route files).
3. In **Zo Settings → Advanced → Secrets**, add:
   - `ENIX_LEADS_EXPORT_TOKEN` (output of `openssl rand -hex 32`)
   - `ALLOWED_ORIGINS=https://enixexteriors.com,https://www.enixexteriors.com`
4. The endpoints are now live at `https://<your-zo>.zo.space/api/enix-lead`
   and `…/api/enix-leads-export`.

## Deploy — Bun standalone

If you want to run this outside Zo Space (Fly.io, Railway, a VPS, etc.),
wrap the two handlers in a Hono app:

```ts
import { Hono } from "hono";
import lead from "./enix-lead";
import exporter from "./enix-leads-export";

const app = new Hono();
app.all("/api/enix-lead", (c) => lead(c));
app.get("/api/enix-leads-export", (c) => exporter(c));

export default { port: Number(process.env.PORT || 3002), fetch: app.fetch };
```

Then `bun run server.ts`.

## Rotating the export token

```bash
NEW=$(openssl rand -hex 32)
# Update ENIX_LEADS_EXPORT_TOKEN in Zo Settings → Advanced → Secrets
# Roll the token in your password manager / ops runbook
# Tell every admin to update their saved value
```

## Adversarial test matrix (mapped to the audit mandate)

| # | Test | Status |
| --- | --- | --- |
| 1 | Happy path → record stored | ✅ |
| 2 | Missing required fields → 422 | ✅ |
| 3 | Invalid email shape → 422 | ✅ |
| 4 | Phone < 7 digits → 422 | ✅ |
| 5 | Oversized payload → 413 before parse | ✅ |
| 6 | Unknown fields (`__proto__`, `admin`) → 422 (strict) | ✅ |
| 7 | 100 rapid requests → 429 after `RATE_LIMIT_MAX` | ✅ |
| 8 | `<script>` in message → stored verbatim, HTML-escaped on render | ✅ |
| 9 | CSV-injection (`=CMD|'/C calc'!A0`) → prefixed with `'` on export | ✅ |
| 10 | 100 concurrent writes → no JSON corruption (mutex test) | ✅ |
| 11 | `leads.json > LEADS_SOFT_LIMIT` → warn log | ✅ |

| # | Export test | Status |
| --- | --- | --- |
| 1 | No `Authorization` → 401 | ✅ |
| 2 | Wrong token → 401 (constant-time) | ✅ |
| 3 | Valid token → 200 + correct headers | ✅ |
| 4 | CSV headers row present | ✅ |
| 5 | All records returned | ✅ |
| 6 | RFC-4180 escapes for commas/quotes/newlines | ✅ |
| 7 | Formula-attack neutralised | ✅ |
