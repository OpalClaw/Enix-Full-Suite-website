# Changelog

All notable changes to this project are documented in this file.

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
and the format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

Nothing yet.

## [0.1.0] — 2026-05-25

Initial public release. Three deployable components, hardened to enterprise
standards, with a single-tenant deployment target and a documented
multi-tenant migration path.

### Added

#### Frontend (`frontend/`)
- Vite 6 + React 18 SPA covering: public marketing site, 50-article
  SEO Education Hub (Tennessee roofing E-E-A-T optimized), CRM
  dashboard, client portal, SmartDocs estimate-to-signature editor.
- Vendor chunk splitting (react, radix, query, charts, pdf, icons,
  three) for cache stability.
- Build-time validation: refuses to build if `VITE_API_BASE_URL` or
  `VITE_LEAD_API_URL` are missing in production.
- Hardened 404 page (removed dev-mode admin leakage).
- 0 lint errors after `lint:fix`.

#### Backend (`backend/`)
- Express 5 + TypeScript strict + Drizzle ORM + PostgreSQL 15.
- Argon2id password hashing (OWASP 2024 parameters: memCost 19 MiB,
  timeCost 2, parallelism 1).
- JWT HS256 with explicit `algorithms: ['HS256']` allowlist
  (alg=none and alg-confusion blocked; covered by tests).
- Refresh-token rotation with **session-family revocation on token
  reuse** — a reused refresh token revokes every session for the
  user as a theft signal.
- Account lockout after 5 failed login attempts in a 15-minute
  window; 15-minute lock duration; reset on success.
- Constant-time login: dummy Argon2 verify runs for nonexistent
  users to prevent timing-based user enumeration.
- Server refuses to start if `JWT_ACCESS_SECRET` or
  `JWT_REFRESH_SECRET` are unset, equal, or shorter than 32 bytes.
- Correlation ID middleware: every request and error response
  carries a `request_id`; CRLF-stripped to prevent header injection.
- Helmet defaults extended with explicit COOP, CORP, HSTS preload,
  X-Frame-Options DENY, Referrer-Policy strict-origin-when-cross-
  origin, and a Permissions-Policy locking down camera, microphone,
  geolocation, payment, USB, magnetometer, accelerometer, gyroscope,
  and interest-cohort.
- CORS allowlist-only; no wildcards; unknown origins return 403.
- Request body capped at 1 MB.
- Per-route rate limits.
- Graceful shutdown with 10-second hard stop.
- Centralized error handler that never leaks stacks or internal
  identifiers; every error response includes `request_id`.
- Multi-tenant scaffold (migration `0001_security_hardening.sql`):
  `tenants` table, nullable `tenant_id` columns on users / customers
  / leads / jobs / estimates / invoices / payments / smart_documents,
  default Enix Exteriors tenant seed, RLS policy templates documented
  in `docs/MULTI_TENANCY.md`.
- 11 unit tests covering JWT algorithm confusion, alg=none rejection,
  type confusion, secret confusion, RS256 confusion, expiry, equal-
  secret rejection, and correlation-ID CRLF injection.

#### Leads-API (`leads-api/`)
- Bun + Hono runtime for Zo Space or any Bun host.
- `POST /api/enix-lead` — public lead intake. Zod strict schema
  (prototype-pollution defense), 64 KB payload cap before JSON
  parse, ASCII control-character stripping, conservative email and
  phone validation, honeypot field, bot user-agent filter, per-IP
  rate limit with pruning.
- `GET /api/enix-leads-export` — admin-only JSON/CSV export, bearer
  token auth with constant-time comparison.
- Atomic file writes (temp file + rename) serialized through an
  in-process write mutex; survives concurrent submissions without
  corruption.
- **OWASP CSV-injection escape** on every exported cell: any value
  starting with `=`, `+`, `-`, `@`, tab, or carriage return is
  prefixed with `'` and RFC-4180 quoted.
- 22 unit tests covering CSV injection vectors, schema strictness,
  prototype-pollution rejection, store concurrency, and missing-file
  handling.

#### Documentation
- `README.md` — executive-ready overview, architecture diagram,
  quickstart, security posture, repo layout, roadmap.
- `SECURITY.md` — supported versions, private disclosure pipeline,
  threat-model summary.
- `CONTRIBUTING.md` — environment setup, coding conventions,
  conventional-commits enforcement, PR process.
- `CODE_OF_CONDUCT.md` — Contributor Covenant 2.1.
- `docs/API.md` — REST reference covering every backend endpoint.
- `docs/THREAT_MODEL.md` — STRIDE-style threat model with mitigations.
- `docs/MULTI_TENANCY.md` — contract every component must honour and
  the single → multi-tenant migration path.
- `frontend/README.md`, `backend/README.md`, `leads-api/README.md`
  — component-level documentation.
- `.env.example` in each component documenting every required
  variable.

#### Governance (`.github/`)
- CI workflow: lint, typecheck, build, npm audit, license-check,
  secret-scan, parallelized across all three components.
- CodeQL workflow with the `security-extended` query suite, weekly
  schedule + every PR.
- Release workflow producing sha256-signed tarballs on `v*.*.*` tags.
- Dependabot weekly for npm + GitHub Actions ecosystems across all
  three components.
- CODEOWNERS gating every path.
- Pull-request template with security-review checklist.
- Issue templates: bug report, feature request, security
  vulnerability (with explicit re-direct to private disclosure).
- gitleaks config + Prettier config + `.editorconfig`.

#### Tooling
- Top-level `Makefile` orchestrating install · build · test · lint ·
  format · migrate · security · clean.
- `.nvmrc` pinning Node 20.11.0.
- `.prettierrc.json` + `.prettierignore`.
- Hardened root `.gitignore` covering build artifacts, `.env*`,
  `*.pem`, `*.key`, `*.crt`, `secrets/`, IDE folders, coverage,
  and local lead data.

### Security

- All authentication, transport, input-validation, and CSV-export
  hardening listed above. See `SECURITY.md` and `docs/THREAT_MODEL.md`
  for the full posture and disclosure pipeline.

[Unreleased]: https://github.com/OpalClaw/Enix-Full-Suite-website/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/OpalClaw/Enix-Full-Suite-website/releases/tag/v0.1.0
