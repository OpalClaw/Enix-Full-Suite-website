# Enix Exteriors — Threat Model

Last revised: 2026-05-25. Reviewed quarterly or on any change to the
authentication, tenant-isolation, document-handling, or payment-handling
surfaces.

## System overview

```
┌─────────────────┐   HTTPS   ┌──────────────────────┐
│ Public visitor  │──────────▶│ frontend/ (Vite SPA) │
└─────────────────┘           │ Cloudflare Pages     │
                              └──┬──────────────┬────┘
                                 │ POST lead    │ JWT (httpOnly cookies)
                                 ▼              ▼
                       ┌──────────────────┐ ┌─────────────────────────────┐
                       │  leads-api/      │ │  backend/                   │
                       │  Hono on         │ │  Express 5 + Drizzle        │
                       │  Zo Space        │ │  PostgreSQL 16              │
                       │  • POST lead     │ │  • Auth + tenants + RLS     │
                       │  • CSV export    │ │  • CRM + portal + SmartDocs │
                       └────────┬─────────┘ └──────┬──────────────────────┘
                                │                  │
                                ▼                  ▼
                          leads.json          Postgres cluster
                        (Zo workspace)        (managed host)
```

## Trust boundaries

| # | Boundary | Notes |
| --- | --- | --- |
| 1 | Public internet → CDN/edge | Cloudflare TLS termination, WAF, basic DDoS scrubbing. |
| 2 | CDN → frontend SPA | Static assets; no privileged data path. |
| 3 | Frontend → backend API | JWT in httpOnly cookies, strict CORS allowlist. |
| 4 | Frontend → leads-api | Strict CORS allowlist, IP rate-limit, honeypot. |
| 5 | Backend → Postgres | TLS connection, RLS isolation, app-level tenant context. |
| 6 | Backend → email provider | API-key in env, no user-supplied content in headers. |
| 7 | Admin tooling → leads-api export | Bearer token, constant-time compare. |
| 8 | Customer → SmartDocs sign link | Single-use signed token in URL, hash-bound. |

## STRIDE analysis

### Spoofing

| Threat | Mitigation |
| --- | --- |
| Forged JWT (alg=none) | `jsonwebtoken` configured with `algorithms: ["HS256"]` allowlist. Tested in `tests/unit/tokens.test.ts`. |
| Forged JWT (algorithm-confusion, RS256→HS256) | Same allowlist + secret never exposed publicly. |
| Stolen access token | 15-minute TTL; refresh-token rotation; reuse triggers session-family revocation. |
| Credential stuffing | Account lockout after 5 failed attempts / 15 min window. Argon2id hashing. |
| User enumeration via login timing | Dummy argon2 hash check runs even for non-existent users — constant time. Generic 401 message. |
| Honeypot bypass on lead form | Multi-signal (UA + honeypot + rate limit + TCPA gate). |

### Tampering

| Threat | Mitigation |
| --- | --- |
| SQL injection via list endpoint sort/filter params | Drizzle parameterized queries; sort/filter inputs validated against an explicit allow-list. |
| Prototype pollution via JSON body | Zod `.strict()` rejects `__proto__`, `constructor`, unknown fields. |
| Document tampering at rest | Server-stored hash; SmartDocs signing records each signature event with IP + UA + timestamp into the `signature_events` table. |
| Leads.json corruption (race) | Serialized writes via in-process mutex + atomic temp+rename. Test: 100 concurrent writes. |

### Repudiation

| Threat | Mitigation |
| --- | --- |
| User denies action | `activity_log` table records actor_id, tenant_id, resource_type, resource_id, action, before/after JSON. Append-only at the application layer; future migration adds DB-level enforcement. |
| Document signing denial | `signature_events` row per envelope event with IP + UA + raw signature payload. |

### Information disclosure

| Threat | Mitigation |
| --- | --- |
| Cross-tenant data leak | Tenant-id scoping at app layer + PostgreSQL RLS policies (enabled in migration 0002). Negative tests in `tests/integration/tenant-isolation.test.ts`. |
| Cross-tenant existence probing | Cross-tenant access returns **404 (not 403)** — does not confirm resource exists. |
| Secret exposure in logs | Pino redact list covers `password`, `password_hash`, `authorization`, `cookie`, `set-cookie`, `token`, `refresh_token` at any depth. |
| Stack trace exposure | Error handler returns generic `internal_error` with correlation ID; stack only in server logs. |
| CSV injection in admin exports | Leading `=`, `+`, `-`, `@`, TAB, CR are prefixed with `'`. RFC 4180 quoting otherwise. |
| Path traversal on documents | Document lookups are by UUID, never by path. Server-side document path is constructed `documents/<tenant_id>/<doc_id>.pdf` — no user input in filesystem path. |

### Denial of service

| Threat | Mitigation |
| --- | --- |
| Lead-form flood | Per-IP rate limit (5 / 10 min in prod). |
| Auth-endpoint flood | Stricter rate limit (10 / min in prod). |
| Oversized JSON body | `express.json({ limit: "1mb", strict: true })`. Leads-api rejects > 64KB before parse. |
| Slow-loris | TLS termination at Cloudflare; backend behind it. |
| Connection-pool exhaustion | `DB_POOL_MAX` default 20; pool errors logged; non-fatal connection errors don't crash the process. |
| Unbounded result sets | Pagination required (`limit ≤ 100`) on every list endpoint. |
| Document generation spam | `docGenLimiter` — 20 req/min per IP in production. |

### Elevation of privilege

| Threat | Mitigation |
| --- | --- |
| Client user editing employee data | `requireRole("admin", "manager", "office", "estimator")` on every CRM route; role read from server-validated JWT, never client. |
| Employee deleting all leads | Delete operations require `requireRole("admin")`. |
| IDOR (Insecure Direct Object Reference) on `/api/customers/:id` | Tenant context middleware scopes all queries; cross-tenant returns 404. |
| Tenant impersonation via tampered cookie | JWT is server-signed; tenant_id (when introduced post-migration 0002) is a JWT claim, not a header/cookie field. |

## Defense-in-depth boundaries

| Layer | Defense |
| --- | --- |
| **Network** | Cloudflare WAF + TLS + DDoS scrubbing |
| **App ingress** | helmet headers, strict CORS, rate limits, body-size cap |
| **Auth** | JWT allowlist, refresh rotation, lockout, constant-time login |
| **Authz** | Role middleware + tenant context middleware on every data route |
| **Data** | Drizzle parameterized queries + PostgreSQL RLS |
| **Audit** | activity_log + signature_events + pino structured logs with correlation IDs |
| **Egress** | Email provider API; no user input in headers; provider key in env-only |

## Out-of-scope (and why)

- **DDoS at the network edge.** Handled by Cloudflare. Out-of-band.
- **Physical security of the Postgres host.** Provider responsibility (Railway,
  Neon, Supabase). Backups + point-in-time-restore are the customer's
  contractual minimum.
- **Compromise of an admin's workstation.** Out of scope for the application;
  mitigated by short session lifetimes + per-session refresh rotation + audit
  logs surfacing anomalous behaviour.

## Open items / accepted risk

| Item | Owner | Status | Notes |
| --- | --- | --- | --- |
| Migrate Postgres `unique(email)` to `unique(tenant_id, email)` | Backend | Scheduled migration 0002 | Single-tenant deploy makes this non-blocking today. |
| Enable RLS policies (currently commented in 0001) | Backend | Scheduled migration 0002 | Requires tenant_id NOT NULL backfill verification. |
| Frontend `localStorage` of refresh token | Frontend | Confirm in audit Stage 5 | Backend already issues refresh via httpOnly cookie; verify SPA does not also persist it. |
| External pen-test before public SaaS launch | Ops | Scheduled | Audit-firm engagement when multi-tenant goes live. |
