# Part B Migration — Status Report

**Built (not deployed). Frontend continues to operate on the lead-only path until the API is provisioned on a VPS and `VITE_BACKEND_ENABLED` is flipped to `true`.**

---

## What's built

### Backend (`/home/workspace/Documents/Enix/enix-api`)

A complete Express 5 + PostgreSQL 16 + Drizzle ORM + JWT API designed to replace every `@base44/sdk` capability used by the frontend.

| Component | Status | Files |
|-----------|--------|-------|
| Project skeleton | ✅ | `package.json`, `tsconfig.json`, `drizzle.config.ts`, `.env.example`, `README.md` |
| Drizzle schema (all 44 entities) | ✅ | `src/db/schema.ts` (594 lines) |
| DB client + migrate runner | ✅ | `src/db/index.ts`, `src/db/migrate.ts` |
| JWT auth (access + refresh, rotated) | ✅ | `src/auth/tokens.ts`, `src/auth/middleware.ts`, `src/services/cookies.ts` |
| Zod request validators | ✅ | `src/validators/schemas.ts` |
| Central error handler | ✅ | `src/middleware/errorHandler.ts` |
| Structured logger (Pino, redacted) | ✅ | `src/utils/logger.ts` |
| Auth routes (register/login/refresh/logout/me + client-login) | ✅ | `src/routes/auth.ts` |
| Leads routes (public POST + rate limit + admin CRUD) | ✅ | `src/routes/leads.ts` |
| Jobs routes (CRUD + `/smart-data` aggregator) | ✅ | `src/routes/jobs.ts` |
| Customers routes | ✅ | `src/routes/customers.ts` |
| Estimates routes (auto-totals, send) | ✅ | `src/routes/estimates.ts` |
| Invoices routes (auto-totals, send, payments) | ✅ | `src/routes/invoices.ts` |
| SmartDocs routes (admin + public token-gated `/sign`) | ✅ | `src/routes/smartdocs.ts` |
| Generic CRUD factory | ✅ | `src/routes/_crud.ts` |
| Express server (helmet, CORS allowlist, graceful shutdown) | ✅ | `src/index.ts` |
| Compiles clean | ✅ | `npx tsc -p tsconfig.json` → zero errors |
| Dependencies installed | ✅ | 311 packages, only known transitive moderate advisories |

### Frontend (`/home/workspace/Documents/Enix/base44-original-code`)

| Component | Status | Files |
|-----------|--------|-------|
| New API client (drop-in for Base44 SDK shape) | ✅ | `src/api/client.js` |
| Shim re-exporting under `base44` for compat | ✅ | `src/api/base44Client.js` |
| `AuthContext` ported off `@base44/sdk` internals | ✅ | `src/lib/AuthContext.jsx` |
| Backend-offline gate (renders `BackendOffline` until env flipped) | ✅ | `src/App.jsx`, `src/components/BackendOffline.jsx` |
| `.env.example` documents `VITE_API_BASE_URL` + `VITE_BACKEND_ENABLED` | ✅ | `.env.example` |
| Build passes | ✅ | `npm run build` → 0 errors |

---

## Mapping — what the new API delivers in place of Base44

| Base44 SDK surface | New API |
|--------------------|---------|
| `base44.auth.me()` | `GET /api/auth/me` |
| `base44.auth.login()` | `POST /api/auth/login` |
| `base44.auth.logout()` | `POST /api/auth/logout` |
| `base44.entities.Lead.create/.list/.filter/.update/.delete` | `/api/leads/*` |
| `base44.entities.Job.*` | `/api/jobs/*` |
| `base44.entities.Customer.*` | `/api/customers/*` |
| `base44.entities.Estimate.*` | `/api/estimates/*` |
| `base44.entities.Invoice.*` | `/api/invoices/*` |
| `base44.entities.SmartDocument.*` | `/api/smartdocs/*` |
| `base44.functions.invoke('validateClientJobAccess')` | `POST /api/auth/client-login` |
| `base44.functions.invoke('getJobSmartData', {jobId})` | `GET /api/jobs/:id/smart-data` |
| `base44.functions.invoke('sendInvoice')` | `POST /api/invoices/:id/send` |
| `base44.functions.invoke('sendDocumentForSignature')` | `POST /api/smartdocs/:id/send` |
| `base44.functions.invoke('signDocument')` | `POST /api/smartdocs/sign/:id/:token` |
| `base44.functions.invoke('autoGenerateSmartDocument')` | `POST /api/smartdocs` |

---

## Cutover procedure (when ready to launch the API)

1. **Provision VPS** — Ubuntu 22.04+, Node 20+, PostgreSQL 16+, Nginx, Certbot
2. **Provision DB**
   ```bash
   sudo -u postgres createuser enix_user --pwprompt
   sudo -u postgres createdb enix_prime_flow -O enix_user
   ```
3. **Deploy API**
   ```bash
   cd /var/www/enix-prime-flow/api
   cp .env.example .env && chmod 600 .env
   # Fill DATABASE_URL, JWT secrets (64-byte hex each), CORS_ORIGINS
   npm ci --omit=dev
   npm run build
   npm run db:generate && npm run db:migrate
   pm2 start dist/index.js --name enix-api
   pm2 save && pm2 startup
   ```
4. **Nginx + TLS**
   ```bash
   # /etc/nginx/sites-available/api.enixexteriors.com → proxy_pass 127.0.0.1:3001
   certbot --nginx -d api.enixexteriors.com
   ```
5. **Seed an admin user** — connect via psql, insert into `users` with `role='admin'` and an Argon2id password hash
6. **Flip the frontend flags**
   ```bash
   # in the frontend deployment env
   VITE_API_BASE_URL=https://api.enixexteriors.com/api
   VITE_BACKEND_ENABLED=true
   ```
   Rebuild and redeploy the frontend.
7. **Smoke test** — `/api/health` from server, login flow from browser, lead intake from form

---

## What's intentionally deferred (not in scope for this build)

- **Email delivery** — SMTP env is documented, no transport wired. Hook up `nodemailer` in `services/email.ts` when needed.
- **S3 uploads** — `UPLOAD_DIR` is local fs in v1. Migrate to S3/R2 when traffic justifies it.
- **Background jobs** — No queue. Add BullMQ + Redis when an async workflow needs it (PDF rendering, email batching).
- **PDF rendering route** — Schema and SDK call wired, route returns 501 until `pdf-lib` template builder ported.
- **EagleView/Stripe integrations** — Tables exist (`eagleview_reports`, etc.), no external API integration yet.
- **Drizzle migrations folder** — Run `npm run db:generate` on first deploy to produce SQL files; intentionally not committed because schema may evolve before launch.

---

## Verification gates

```bash
# Backend type-check
cd enix-api && npx tsc --noEmit && echo OK
# Backend build
cd enix-api && npm run build && ls dist/
# Frontend build
cd base44-original-code && npm run build && ls dist/
```

All three pass clean as of this report.
