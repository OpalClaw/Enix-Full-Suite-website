# Enix Exteriors — Full Suite

Complete production-grade codebase for Enix Exteriors, a roofing and exterior services company. Three independent deployable components, one monorepo.

## Components

### `frontend/`
React + Vite SPA (Tailwind, shadcn/ui). The customer-facing website — public pages, blog (50 articles), CRM dashboard, lead intake form, client portal.  
**Deploys to:** Cloudflare Pages, Zo Space, or any static host.  
**Build:** `cd frontend && npm install && npm run build`

### `leads-api/`
Zo Space API routes (Bun/Hono). Lightweight lead intake + CSV export endpoints. No database — persists to `leads.json`.  
**Deploys to:** Zo Space (`/api/enix-lead`, `/api/enix-leads-export`).  
**Source:** TypeScript route files with inline comments.

### `backend/`
Express + TypeScript + Drizzle ORM + PostgreSQL. Full multi-tenant CRM backend — auth (JWT + refresh tokens), estimates, invoices, jobs, customers, Smart Document engine, activity logging.  
**Deploys to:** Any Node host (Zo process, VPS, Railway, Fly.io).  
**Start:** `cd backend && npm install && npm run build && npm start`

## Quick Start

```bash
# Frontend preview
cd frontend && npm install && npm run dev

# Backend (requires PostgreSQL + .env config)
cd backend && npm install && cp .env.example .env  # fill in values
npm run build && npm start

# Leads API — deploy to Zo Space
# Copy leads-api/*.ts as Zo Space API routes
```

## Documentation

| File | Contents |
|------|----------|
| `HANDOFF.md` | Full client handoff doc — setup, deploy, monitor |
| `ARCHITECTURE.md` | System architecture, data flow, route map |
| `DEPLOYMENT.md` | Deployment guide — Zo, Cloudflare, VPS |
| `SECURITY.md` | Security posture, headers, rate limiting, audit |
| `CHANGELOG.md` | Version history |
| `docs/` | Supporting diagrams and reference material |
| `automations/` | Scheduled agent specs (SMS notifier, daily backup) |
| `LICENSE` | MIT License |

## V3 Changelog

See `CHANGELOG.md` for the full v3 final changelog. This release passes zero-adversarial audit, ships WCAG AA-labeled frontend, hardened security headers, rate-limited API, and full CRM backend.
