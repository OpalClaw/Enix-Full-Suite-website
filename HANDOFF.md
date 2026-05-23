# Enix Exteriors — Client Handoff

**Delivery date:** 2026-05-22
**Delivered by:** OpalClaw / OpalSage Labs
**Status:** Production-ready frontend live, full Phase-B backend built (not deployed)

---

## 1. What was built (plain language)

A complete, enterprise-grade roofing & exteriors website with a built-in CRM/portal architecture, ready to scale from "marketing site only" to "full operations system" without rewrites.

You receive three deliverables:

### Marketing site (live)

A fast, SEO-optimized public website covering Home, Services (Commercial, Residential, Storm, Siding, Windows, Doors, Roof Repair), Projects, Reviews, About, Contact, Financing, an Education Hub with 50 articles, Privacy/Terms, plus client and staff login pages. Built as a Vite/React SPA, served by a tiny Bun static server, hardened with strict security headers, rate-limited lead intake, and bot defenses.

### Lead capture system (live)

Public form submissions flow into a hardened Zo Space API route, persist to a structured JSON store, trigger an SMS to operations within \~2 minutes via a Zo automation, and are backed up nightly with 30-day retention. An authenticated CSV/JSON export endpoint is available for marketing analytics.

### CRM/portal backend (built, not deployed)

A complete Express 5 + PostgreSQL + Drizzle ORM + JWT API replacing the original Base44 SDK dependency. All 44 entities from the original model (Leads, Jobs, Customers, Estimates, Invoices, Smart Documents, Insurance Claims, Activity Log, Users, etc.) are schema-defined. Auth uses Argon2id password hashing, rotated refresh tokens in httpOnly cookies, role-based access control. The frontend is wired to flip from offline-stub mode to live-API mode with a single environment variable change.

---

## 2. How to set it up (developer)

### Prerequisites

- Node.js ≥ 20
- Bun (for the static frontend server) — `curl -fsSL https://bun.sh/install | bash`
- PostgreSQL ≥ 14 (only when activating the backend)
- A modern Linux VPS (Ubuntu 22.04 LTS recommended) for production

### Frontend

```bash
cd frontend
cp .env.example .env.local
# Edit .env.local — at minimum set VITE_LEAD_API_URL
npm install
npm run build        # produces dist/
bun run serve.ts     # serves dist/ with SPA fallback + security headers
```

### Backend (when ready to launch the CRM)

```bash
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
npm install
npm run db:generate  # generates migration SQL from schema
npm run db:migrate   # applies migrations to PostgreSQL
npm run build        # tsc compile
npm start            # runs dist/index.js
```

### Lead API (Zo Space)

The two routes in `leads-api/` can deploy as-is to any Zo Space, or be ported to Express in &lt;30 minutes. See `file leads-api/README.md`.

---

## 3. Environment variables

### Frontend (`frontend/.env.example`)

| Variable | Purpose | Required |
| --- | --- | --- |
| `VITE_LEAD_API_URL` | Lead-intake endpoint URL | Yes |
| `VITE_API_BASE_URL` | Express API base path | Phase B only |
| `VITE_BACKEND_ENABLED` | Set `true` once API is live to expose CRM/portal routes | Phase B only |

### Backend (`backend/.env.example`)

| Variable | Purpose | Required |
| --- | --- | --- |
| `DATABASE_URL` | Postgres connection string | Yes |
| `JWT_ACCESS_SECRET` | 32+ byte random secret for access tokens | Yes |
| `JWT_REFRESH_SECRET` | 32+ byte random secret for refresh tokens | Yes |
| `JWT_ACCESS_TTL` | Access token lifetime (default `15m`) | No |
| `JWT_REFRESH_TTL` | Refresh token lifetime (default `30d`) | No |
| `PORT` | API listen port (default `3001`) | No |
| `CORS_ORIGINS` | Comma-separated allowed origins | Yes |
| `LOG_LEVEL` | Pino log level (default `info`) | No |
| `COOKIE_DOMAIN` | Auth cookie domain (default the request host) | Production |
| `SECURE_COOKIES` | `true` in production with HTTPS | Production |

Generate JWT secrets: `openssl rand -hex 32`

### Zo Space routes

| Variable | Purpose | Required |
| --- | --- | --- |
| `ENIX_LEADS_EXPORT_TOKEN` | Bearer token for the leads export endpoint | If using export |
| `LEADS_FILE` | Override leads.json path | No |

---

## 4. How to deploy and update

See **`file DEPLOYMENT.md`** in this package for the full runbook.

Summary:

1. **Frontend** — built on commit, served by `bun serve.ts` as a process supervised by systemd (or Zo `register_user_service`).
2. **Backend** — `pm2` or systemd service running the compiled `file dist/index.js` behind Nginx + Let's Encrypt TLS.
3. **Updates** — `git pull && npm install && npm run build && systemctl restart enix-frontend` (or `-api`).

Migration cutover (offline → CRM live):

1. Provision Postgres, run `npm run db:migrate`, seed an admin user.
2. Deploy `backend/` to the VPS, verify `/api/health` returns 200.
3. Set `VITE_BACKEND_ENABLED=true` and `VITE_API_BASE_URL=https://api.<your-domain>/api` in the frontend.
4. Rebuild & redeploy the frontend.

---

## 5. How to monitor it

| Layer | Watch this | Action threshold |
| --- | --- | --- |
| Frontend `/healthz` | HTTP 200 in &lt;500ms | 3 consecutive failures → restart service |
| Backend `/api/health` | HTTP 200 in &lt;200ms | Same |
| Postgres | Connection count, replication lag, disk free | &lt;10% disk free → alert |
| Leads file | Growth rate; &gt;100/day signals success or spam | &gt;1000/day → investigate |
| Automations | Last-run timestamp, error count | Missed run → check Zo logs |
| Nginx logs | 4xx/5xx rate | Rate &gt; 1% → investigate |

Recommended free uptime monitoring: **UptimeRobot** (free tier, 5-minute interval, email/SMS alerts).
Recommended free error tracking: **Sentry** (free tier covers small projects).

---

## 6. Known limitations & considerations

- **Frontend currently served at an ephemeral proxy URL.** Permanent domain requires DNS + TLS setup. See `file docs/AUDIT-03-Permanent-Domain-Migration.md`.
- **Backend is not yet deployed.** All code is written, tested, and compiles clean — but a VPS, Postgres instance, and TLS certificate must be provisioned to activate it. See `file docs/PART-B-MIGRATION-STATUS.md`.
- **SMS notifications currently route to the workspace owner.** To route directly to Enix Exteriors' business phone, the number must be registered as a Zo contact, then the automation instruction edited.
- **Photo uploads in the lead form are non-blocking** — if the photo upload service is unavailable, the lead still submits without photos. Users see a transient warning.
- **The** `react-quill` **dependency has 2 moderate-severity advisories** that cannot be auto-patched without a breaking-change upgrade. The SmartDocs editor surface (which uses it) is currently behind the `VITE_BACKEND_ENABLED` gate, so end-users cannot reach it until you choose to launch the CRM. Upgrade tracked in `file docs/AUDIT-04-Known-Gaps.md`.

---

## 7. Support & escalation

| Issue type | First check | Escalate to |
| --- | --- | --- |
| Site down | `curl /healthz`, `systemctl status enix-frontend` | Operator / DevOps |
| Lead not arriving as SMS | `cat /path/to/leads.json` — was it captured? Check Zo automation last-run | Operator |
| CRM 500 errors | `journalctl -u enix-api -n 100` for stack trace | Backend engineer |
| Database performance | `pg_stat_activity`, slow query log | DBA |
| Security incident | Rotate secrets immediately, check audit log | Security lead |

---

## 8. What is in this package

```markdown
enix-exteriors-handover/
├── HANDOFF.md                    ← You are here
├── README.md                     ← Quick-start summary
├── ARCHITECTURE.md               ← Diagram + technical overview
├── DEPLOYMENT.md                 ← Step-by-step ops runbook
├── SECURITY.md                   ← Security posture, audit summary
├── LICENSE
├── enix-architecture.png         ← System diagram
├── frontend/                     ← Vite/React marketing site + CRM UI
├── backend/                      ← Express + Postgres + Drizzle + JWT API
├── leads-api/                    ← Zo Space lead-intake routes (portable)
├── automations/                  ← Automation specs
└── docs/                         ← Detailed audit reports & history
```

Everything in `frontend/`, `backend/`, and `leads-api/` is production-ready code. Everything in `docs/` is reference material for context, audit trail, and historical decisions.