# Enix — Lead Intake API

Two small platform-agnostic handlers for the public lead form.

## Files

- **`enix-lead.ts`** — `POST /api/enix-lead`. Public endpoint accepting the lead form payload. Hardened with rate limiting, honeypot, CORS allowlist, bot UA filter, TCPA consent gate.
- **`enix-leads-export.ts`** — `GET /api/enix-leads-export`. Admin-only export (bearer auth). Returns JSON or CSV.

## Storage

Leads append to `LEADS_FILE` (default `/home/workspace/Documents/Enix/leads.json`). Each record:

```json
{
  "id": "uuid",
  "received_at": "ISO 8601",
  "notified": false,
  "notified_at": null,
  "name": "string",
  "email": "string",
  "phone": "string",
  "service": "string",
  "address": "string",
  "city": "string",
  "state": "string",
  "zip": "string",
  "message": "string",
  "tcpaConsent": true,
  "ip": "string",
  "user_agent": "string",
  "referer": "string"
}
```

## Deploy

### Option A — Zo Space (current setup)
1. Save each file to your Zo Space at paths `/api/enix-lead` and `/api/enix-leads-export`.
2. Set `ENIX_LEADS_EXPORT_TOKEN` (random opaque string) in Zo Settings → Advanced → Secrets.
3. Update `ALLOWED_ORIGINS` in `enix-lead.ts` to include your production frontend origin(s).

### Option B — Express / Fastify / any Node server
Both files are framework-agnostic logic with Hono `Context` adapters. To port:
- Replace `c.req.header(name)` with `req.headers[name.toLowerCase()]`.
- Replace `c.req.json()` with `req.body` (after `express.json()`).
- Replace `c.json(payload, status)` with `res.status(status).json(payload)`.
- Replace `c.header(k, v)` with `res.setHeader(k, v)`.

## Environment

```
LEADS_FILE=/path/to/leads.json                # optional, sensible default
ENIX_LEADS_EXPORT_TOKEN=<opaque-random>       # required for /enix-leads-export
```

Generate the export token: `openssl rand -hex 32`

## Test

```bash
# Successful lead submission
curl -X POST https://api.example.com/api/enix-lead \
  -H "Content-Type: application/json" \
  -H "Origin: https://enixexteriors.com" \
  -d '{"name":"John","email":"j@example.com","phone":"8655551234","service":"Roofing","tcpaConsent":true}'

# Export leads as JSON
curl -H "Authorization: Bearer $ENIX_LEADS_EXPORT_TOKEN" \
  https://api.example.com/api/enix-leads-export

# Export as CSV
curl -H "Authorization: Bearer $ENIX_LEADS_EXPORT_TOKEN" \
  https://api.example.com/api/enix-leads-export?format=csv -o leads.csv
```
