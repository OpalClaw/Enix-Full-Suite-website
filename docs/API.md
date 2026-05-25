# Enix API — REST Reference

**Base URL** (production): `https://api.enixexteriors.com`
**Base URL** (local): `http://localhost:3001`

All endpoints under `/api/*`. Every JSON response includes `request_id`
on error.

## Authentication model

- Access token: JWT (HS256), 15-minute TTL, delivered via httpOnly cookie
  `enix_access` AND returned as Authorization header acceptable.
- Refresh token: JWT (HS256), 30-day TTL, httpOnly cookie `enix_refresh`,
  path-bound to `/api/auth/refresh`.
- **Refresh-token rotation with reuse detection**: a successful refresh
  invalidates the presented token and issues a new pair. A reused
  refresh token revokes **all** sessions for that user.

## Common response envelope

**Success:**

```json
{ "data": {...}, "ok": true }
```

or a bare resource object for single-resource GETs.

**Error:**

```json
{
  "error": "validation_failed",
  "message": "Request payload failed validation",
  "request_id": "0e3ab9c1-...",
  "details": [{ "path": "email", "code": "invalid_string", "message": "..." }]
}
```

## Rate limits

| Scope | Limit (production) | Header |
| --- | --- | --- |
| auth (login/register/refresh/logout/client-login) | 10 req / 1 min | `RateLimit-*` (draft-7) |
| public_write (POST /api/leads) | 5 req / 10 min | `Retry-After` on 429 |
| data (GET endpoints) | 200 req / 1 min | `RateLimit-*` |
| doc_gen (PDF generation) | 20 req / 1 min | `RateLimit-*` |

## HTTP status codes

| Code | Meaning |
| --- | --- |
| 200 | OK |
| 201 | Created |
| 400 | Validation failed |
| 401 | Unauthorized — missing / invalid auth |
| 403 | Forbidden — role / CORS denied |
| 404 | Not found (or hidden cross-tenant resource) |
| 409 | Conflict (unique / FK violation) |
| 413 | Payload too large |
| 422 | Schema validation failed |
| 429 | Rate limited (includes `Retry-After`) |
| 500 | Internal error |
| 503 | Degraded (DB down on `/api/health`) |

---

## `/api/health`

`GET /api/health`. Public. Returns `{ status, db, uptime, check_ms }`.
Latency < 200ms. Used by Kubernetes/Railway probes and Cloudflare health
checks.

## `/api/version`

`GET /api/version`. Public. Returns `{ name, version, node, env }`.

---

## `/api/auth`

### `POST /api/auth/register`

Public. Create a customer account.

```http
POST /api/auth/register
Content-Type: application/json

{ "email": "jane@example.com", "password": "min-8-chars", "full_name": "Jane Roof", "phone": "8655551234" }
```

Returns `201 { id, email, role }`. Conflicts return 409.

### `POST /api/auth/login`

Public. Email + password.

```http
POST /api/auth/login
Content-Type: application/json

{ "email": "jane@example.com", "password": "..." }
```

Returns `200 { user }` and sets `enix_access` + `enix_refresh` cookies.
**Invalid creds:** 401 with generic message (no enumeration).
**Account locked:** 429 with `Retry-After` header.

### `POST /api/auth/client-login`

Public. Customer-portal login using **job number + email**.

```http
POST /api/auth/client-login
{ "job_number": "JOB-2026-001", "email": "jane@example.com" }
```

Returns `200 { user, job }` and sets cookies.

### `POST /api/auth/refresh`

Cookie-based. Reads `enix_refresh`. Rotates the refresh token (old one
becomes invalid). **Reuse of a rotated refresh token revokes all user
sessions.** Returns `200 { ok: true }`.

### `POST /api/auth/logout`

Revokes the current session and clears cookies. Returns `200 { ok: true }`.

### `GET /api/auth/me`

Requires auth. Returns the current user object.

---

## `/api/leads`

### `POST /api/leads`

Public, rate-limited. Accepts the lead-form payload identical to the
leads-api `POST /api/enix-lead` (the two endpoints exist for backend
deployments that don't use Zo Space; pick one). Honeypot field `website`
must be empty.

```http
POST /api/leads
{
  "first_name": "Jane", "last_name": "Roof",
  "email": "jane@example.com", "phone": "8655551234",
  "service": "Roofing", "property_type": "residential",
  "tcpa_consent": true, "source": "website"
}
```

Returns `201 { ok: true, stored: true, lead_id }`.

### `GET /api/leads`

Auth + role (`admin|manager|office|estimator`). Paginated list.

Query params: `q`, `status`, `limit` (≤100), `offset`, `order` (`asc|desc`).

### `GET /api/leads/:id` / `PATCH /api/leads/:id` / `DELETE /api/leads/:id`

`PATCH` body validates against `updateLeadSchema` (status, priority,
assigned_to, notes). `DELETE` requires `admin`. Cross-tenant `:id`
returns **404**.

---

## `/api/customers`

CRUD via the generic factory. Auth + role.

| Method | Path | Roles | Notes |
| --- | --- | --- | --- |
| GET | `/api/customers` | admin, manager, office, estimator | Paginated. Validated sort params. |
| GET | `/api/customers/:id` | (same) | 404 cross-tenant. |
| POST | `/api/customers` | admin, manager | |
| PATCH | `/api/customers/:id` | admin, manager | |
| DELETE | `/api/customers/:id` | admin | |

---

## `/api/jobs`

| Method | Path | Roles | Notes |
| --- | --- | --- | --- |
| GET | `/api/jobs` | any auth (clients see only their `client_job_number`) | Paginated. |
| GET | `/api/jobs/:id` | any auth (tenant + ownership) | 404 cross-tenant. |
| POST | `/api/jobs` | admin, manager, estimator | Generates `job_number`. |
| PATCH | `/api/jobs/:id` | admin, manager, estimator | Status transitions validated. |
| DELETE | `/api/jobs/:id` | admin | |
| GET | `/api/jobs/:id/smart-data` | any auth (tenant + ownership) | Pre-assembled view for the portal. |

---

## `/api/estimates`

| Method | Path | Roles |
| --- | --- | --- |
| GET | `/api/estimates` | admin, manager, estimator, office |
| GET | `/api/estimates/:id` | any auth (own or staff) |
| POST | `/api/estimates` | admin, manager, estimator |
| PATCH | `/api/estimates/:id` | admin, manager, estimator |
| POST | `/api/estimates/:id/send` | admin, manager, estimator |
| POST | `/api/estimates/:id/accept` | any (via signed token) |

`POST /:id/send` triggers PDF generation + email (errors logged, not
returned). `POST /:id/accept` is reachable from the portal with a per-
estimate signed token.

---

## `/api/invoices`

| Method | Path | Roles |
| --- | --- | --- |
| GET | `/api/invoices` | any auth (client sees own) |
| GET | `/api/invoices/:id` | any auth (tenant + ownership) |
| POST | `/api/invoices` | admin, manager, office |
| POST | `/api/invoices/:id/send` | admin, manager, office |
| POST | `/api/invoices/:id/payments` | admin, manager, office |

`POST /:id/payments` records a payment and updates `amount_paid` /
`status` (paid / partial). Idempotency: idempotency-key header supported.

---

## `/api/smartdocs`

| Method | Path | Roles |
| --- | --- | --- |
| GET | `/api/smartdocs` | admin, manager, office |
| GET | `/api/smartdocs/:id` | any auth (tenant + ownership) |
| POST | `/api/smartdocs` | admin, manager, estimator |
| POST | `/api/smartdocs/:id/send` | admin, manager, estimator |
| GET | `/sign/:id/:token` | public (signed) |
| POST | `/sign/:id/:token` | public (signed) |

The `/sign` endpoints accept a per-document signed `token` in the URL.
Token is HMAC-bound to the document id and signer email. Signing events
are recorded in `signature_events` with IP, user agent, raw signature
payload, and timestamp.

---

## OpenAPI

A machine-readable OpenAPI 3.1 spec is generated from this document at
`docs/openapi.yaml` (build target: future). For now, this Markdown is
the source of truth. Every PR that changes a route MUST update this
file.

## Auditing

Every mutating action writes to `activity_log`:

```json
{
  "actor_id": "user-uuid",
  "tenant_id": "tenant-uuid",
  "resource_type": "lead",
  "resource_id": "lead-uuid",
  "action": "update",
  "before": {...},
  "after": {...},
  "ip": "...",
  "user_agent": "...",
  "created_at": "..."
}
```

`activity_log` is **append-only** at the application layer (no DELETE /
UPDATE endpoints). Read via `GET /api/activity` (admin / manager only),
paginated, filterable by user, resource type, date range.
