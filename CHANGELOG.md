# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- **Enterprise audit pass (`enterprise-audit-v1` branch)** — full
  OpalSageLabs governance scaffolding:
  - GitHub Actions CI: lint, typecheck, build, audit, license-check,
    secret-scan, CodeQL, release pipeline.
  - Dependabot for npm + GitHub Actions ecosystems on all 3 components.
  - Issue templates (bug, feature, security), PR template, CODEOWNERS.
  - `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `.editorconfig`,
    `.prettierrc.json`, `.gitleaks.toml`.
  - Top-level `Makefile` orchestrating install/build/test/migrate/audit/
    secret-scan/license-check/docker.
- **Security hardening across all three components**:
  - `leads-api`: CSV-injection escape (`=`, `+`, `-`, `@`, `\t`, `\r`),
    concurrent-write mutex, Zod `.strict()` validation, payload size cap.
  - `backend`: refresh-token reuse detection (token theft signal),
    account lockout after 5 failed login attempts, correlation IDs on
    every error, explicit HTTP security headers (HSTS, frame-deny,
    referrer-policy, permissions-policy, COOP), trusted-proxy-aware
    rate limiting per-route-class.
  - `frontend`: 404 page audit, build-time env-var validation, removal
    of `@base44/sdk` dependency, lead-form double-submit prevention.
- **Multi-tenancy migration** (`backend/src/db/migrations/0001_multi_tenant.sql`):
  `tenants` table, `tenant_id NOT NULL` on every business table,
  per-tenant unique indexes, PostgreSQL RLS policies, default-tenant
  seed for the Enix Exteriors deployment.
- **Tests**: integration tests for tenant isolation, JWT algorithm
  confusion / `alg=none`, CSV injection, refresh-token reuse.
- **Docs**: full `docs/API.md` (OpenAPI 3.1), per-component READMEs
  rewritten to OpalSageLabs standard, `THREAT_MODEL.md`, this CHANGELOG.

### Changed

- `.gitignore` extended to cover `*.pem`, `*.key`, `*.crt`, `secrets/`,
  drizzle migration cache, AI scratch dirs.
- `SECURITY.md` rewritten with private disclosure pipeline and
  OpalSageLabs `security@opalsagelabs.dev` contact.

### Security

- Locked CORS allowlist on `leads-api` (no `*`).
- Constant-time token comparison for export endpoint (was already in
  place; covered by tests now).
- Zod `.strict()` rejects unknown fields (prototype-pollution defense).
- `helmet` config now sets HSTS + frame-deny + referrer-policy +
  permissions-policy + COOP/COEP on every backend response.

## [1.0.0] — 2026-05-22

### Added

- Initial monorepo delivery: `frontend/` (React + Vite + Tailwind +
  shadcn/ui), `backend/` (Express 5 + Drizzle + Postgres + JWT),
  `leads-api/` (Hono on Zo Space).
- 44-entity Drizzle schema covering leads, customers, jobs, estimates,
  invoices, payments, smart documents, signature events.
- Public website: 19 marketing pages + Education/blog index + dynamic
  blog post route.
- CRM dashboard: 27 routes covering leads, jobs, estimates, contracts,
  measurements, calendar, crew, materials, messages, invoices,
  warranties, reports.
- Client portal: 11 routes covering dashboard, jobs, estimates,
  invoices, documents, warranty, messages, support.
- SmartDocs editor + templates + public signing page.
- Hardened lead intake on `leads-api` with rate limiting, honeypot,
  TCPA gate, CORS allowlist, bot UA filter.
- Bearer-auth admin export endpoint with constant-time token compare.
- Static-server (`frontend/serve.ts`) with CSP, HSTS, MIME type
  enforcement, SPA fallback, `/healthz` probe.

[Unreleased]: https://github.com/OpalClaw/Enix-Full-Suite-website/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/OpalClaw/Enix-Full-Suite-website/releases/tag/v1.0.0
