<div align="center">

# Enix Exteriors — Full Suite

**Production-grade roofing & exterior services platform.** Monorepo:
marketing website, CRM dashboard, client portal, smart-document engine,
hardened lead-intake API.

[![CI](https://github.com/OpalClaw/Enix-Full-Suite-website/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/OpalClaw/Enix-Full-Suite-website/actions/workflows/ci.yml)
[![CodeQL](https://github.com/OpalClaw/Enix-Full-Suite-website/actions/workflows/codeql.yml/badge.svg)](https://github.com/OpalClaw/Enix-Full-Suite-website/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](./.nvmrc)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://www.conventionalcommits.org)

**An [OpalSageLabs](https://opalsagelabs.dev) production system.**

</div>

---

## Table of contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Quickstart](#quickstart)
- [Components](#components)
- [Environment variables](#environment-variables)
- [Deployment](#deployment)
- [Security](#security)
- [Testing](#testing)
- [Documentation](#documentation)
- [License](#license)

---

## Overview

Enix Exteriors is a roofing and exteriors company. This repository contains
the entire production software stack that powers their digital presence and
operations:

| Surface | Audience | Component |
| --- | --- | --- |
| Marketing website + lead intake | Prospects | `frontend/` + `leads-api/` |
| CRM dashboard | Office, sales, project managers | `frontend/` + `backend/` |
| Client portal | Customers with active jobs | `frontend/` + `backend/` |
| SmartDocs (e-sign) | Customers + office | `frontend/` + `backend/` |

The system is **single-tenant by default** (one deployment per roofing
company) but has been architected with `tenant_id` columns and PostgreSQL
RLS in place so it can be operated as a multi-tenant SaaS without schema
changes. See [`docs/MULTI_TENANCY.md`](./docs/MULTI_TENANCY.md).

## Architecture

```
                    ┌────────────────────────┐
   Public           │  frontend/  (Vite SPA) │  ← Cloudflare Pages
   visitors  ─────▶ │  Marketing • CRM • Portal • SmartDocs │
                    └─────┬───────────────┬──┘
                          │               │
                          │ POST lead     │ HTTPS + JWT
                          ▼               ▼
              ┌────────────────────┐  ┌────────────────────────┐
              │  leads-api/        │  │  backend/              │
              │  Hono on Zo Space  │  │  Express 5 + Drizzle   │
              │  Public POST       │  │  PostgreSQL 16         │
              │  Admin CSV export  │  │  RLS-isolated tenants  │
              └────────┬───────────┘  └──────┬─────────────────┘
                       │                     │
                       ▼                     ▼
                 leads.json file        Postgres cluster
                 (Zo workspace)         (Railway/Fly.io/VPS)
```

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) and `enix-architecture.png`
for full diagrams + data flow.

## Quickstart

```bash
git clone git@github.com:OpalClaw/Enix-Full-Suite-website.git
cd Enix-Full-Suite-website

# Install everything (frontend npm, backend npm, leads-api bun)
make install

# Boot a local Postgres in Docker and run migrations
make db-up
make migrate
make seed         # creates default tenant + admin user

# Run all three dev servers concurrently
make dev
#   FE   → http://localhost:5173
#   BE   → http://localhost:3001
#   LEAD → http://localhost:3002
```

Prerequisites: **Node ≥ 20**, **Bun ≥ 1.1**, **Postgres ≥ 15** (or Docker),
**Make**.

## Components

### 📦 `frontend/` — React + Vite + Tailwind + shadcn/ui

The customer-facing marketing site, the CRM dashboard, the client portal,
and the SmartDocs editor — all served as a single SPA. Public pages are
SEO-indexable; CRM and portal routes are auth-gated.

See [`frontend/README.md`](./frontend/README.md).

### 📦 `backend/` — Express 5 + Drizzle + Postgres + JWT

The CRM + portal + SmartDocs API. 44-entity Drizzle schema, JWT auth with
refresh-token rotation + reuse detection + account lockout, multi-tenant
isolation with PostgreSQL RLS, append-only activity log, PDF generation
via `pdf-lib`, transactional email hooks.

See [`backend/README.md`](./backend/README.md) and
[`docs/API.md`](./docs/API.md).

### 📦 `leads-api/` — Hono on Zo Space

Two small, hardened public endpoints:

- `POST /api/enix-lead` — public lead intake with rate-limit, honeypot,
  bot-UA filter, TCPA consent gate, payload-size cap, CSV-injection
  escape, concurrent-write mutex.
- `GET /api/enix-leads-export` — admin-only export (JSON or CSV) with
  bearer auth (constant-time compare).

See [`leads-api/README.md`](./leads-api/README.md).

## Environment variables

Each component has its own `.env.example`. Top-level summary:

| Variable | Component | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | frontend | Backend base URL |
| `VITE_LEADS_API_URL` | frontend | Leads-API base URL |
| `VITE_BACKEND_ENABLED` | frontend | Gate CRM/portal routes |
| `DATABASE_URL` | backend | Postgres connection string |
| `JWT_ACCESS_SECRET` | backend | Access-token signing key (≥32 chars, ≠ refresh) |
| `JWT_REFRESH_SECRET` | backend | Refresh-token signing key (≥32 chars, ≠ access) |
| `CORS_ORIGINS` | backend | Comma-separated allow-list |
| `PORT` | backend | Default `3001` |
| `LEADS_FILE` | leads-api | Path to `leads.json` |
| `ENIX_LEADS_EXPORT_TOKEN` | leads-api | Bearer secret for admin export |
| `ALLOWED_ORIGINS` | leads-api | Comma-separated allow-list |

## Deployment

| Component | Recommended host | Why |
| --- | --- | --- |
| `frontend/` | Cloudflare Pages | Edge SPA hosting, free TLS, custom domain |
| `backend/` | Railway / Fly.io / Render | Long-running process, Postgres locality |
| `leads-api/` | Zo Space | Singleton public endpoints, owner-only export |
| Postgres | Railway / Neon / Supabase | Managed, point-in-time restore |

Full runbook in [`DEPLOYMENT.md`](./DEPLOYMENT.md).

## Security

We take security seriously. **Do not file public issues for vulnerabilities.**
See [`SECURITY.md`](./SECURITY.md) for the private disclosure pipeline.

Implementation highlights:

- ✅ JWT with explicit `algorithms: ["HS256"]` allowlist (no `alg=none` /
  algorithm-confusion)
- ✅ Refresh-token rotation **with reuse detection** — a reused refresh
  token revokes the entire session family (token-theft signal)
- ✅ Account lockout after 5 failed login attempts within 15 minutes
- ✅ argon2id password hashing
- ✅ Multi-tenant data isolation enforced at both application + PostgreSQL
  RLS layers
- ✅ Zod `.strict()` on every public request schema (prototype-pollution
  defense)
- ✅ CSP, HSTS, frame-deny, referrer-policy, permissions-policy on every
  HTTP response
- ✅ Constant-time token comparison on admin export
- ✅ CSV-injection escape on all CSV exports
- ✅ CodeQL + gitleaks + npm audit + license-check on every PR

## Testing

```bash
make test               # all components
make test-backend       # backend only
make test-frontend      # frontend only
make test-leads-api     # leads-api only
```

Integration tests cover: tenant isolation, JWT alg-confusion,
refresh-token reuse, CSV injection escape, lead form attack matrix.

## Documentation

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — system diagram + data flow
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) — production runbook
- [`SECURITY.md`](./SECURITY.md) — disclosure pipeline + threat model summary
- [`docs/API.md`](./docs/API.md) — full backend REST API reference
- [`docs/THREAT_MODEL.md`](./docs/THREAT_MODEL.md) — STRIDE analysis
- [`docs/MULTI_TENANCY.md`](./docs/MULTI_TENANCY.md) — tenant isolation contract
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — how to contribute
- [`CHANGELOG.md`](./CHANGELOG.md) — version history

## License

MIT — see [`LICENSE`](./LICENSE).

---

<div align="center">

Built and maintained by **[OpalSageLabs](https://opalsagelabs.dev)**.

</div>
