# Production Hardening — 2026-05-27

This release closes every operational gap blocking the Enix Full Suite from a
$50k client handoff: 14 missing backend routes, schema/field mismatches across
the CRM, an empty Settings surface, and stubbed integrations. The codebase
ships fully wired with a clean migration path, an admin-driven integration
console, and runtime services for every external API the operations team plans
to plug in.

## What landed

### Backend — 14 new API routes (`backend/src/routes/`)

| Path | Module | Notes |
| --- | --- | --- |
| `/api/tasks` | `tasks.ts` | Bulk + by-id, with filters, validation. |
| `/api/appointments` | `appointments.ts` | Calendar feed (date-range + jobId filters). |
| `/api/warranties` | `warranties.ts` | Customer/manufacturer/manuf-+workmanship matrix, claims jsonb. |
| `/api/inspections` | `inspections.ts` | Residential + commercial, roofing/siding/windows/doors/gutters/storm. |
| `/api/contracts` | `contracts.ts` | DocuSign envelope flow, contract-number generator, PDF body. |
| `/api/proposals` | `proposals.ts` | CRUD against `proposals` (sent → accepted lifecycle). |
| `/api/crews` | `crews.ts` | Crews + members, sorted by name. |
| `/api/messages` | `messages.ts` | Twilio SMS send + log; webhook signature verification. |
| `/api/materials` | `materials.ts` | Catalog CRUD + ABC Supply sync endpoint. |
| `/api/activity` | `activity.ts` | Read-only activity log with entity filter. |
| `/api/insurance-claims` | `insurance_claims.ts` | Claim tracking against jobs. |
| `/api/payments` | `payments.ts` | Invoice payment recording. |
| `/api/users` | `users.ts` | Admin user CRUD (role/title/active). |
| `/api/settings` | `settings.ts` | Read/write integration + company config (admin/manager only). |
| `/api/reviews` | `reviews.ts` | Public read of approved reviews; admin write. |
| `/api/auth/invite-employee` | `auth.ts` | Email invite for any role in the enum. |
| `/api/auth/invite-client` | `auth.ts` | Email invite for a portal account (optionally tied to a job). |

All routes use the existing `requireAuth` + `requireRole` middleware,
`paginationSchema`, and the shared error helpers. Validation is centralised in
`backend/src/validators/schemas.ts`.

### Backend — Integration services (`backend/src/services/`)

| Service | File | Status |
| --- | --- | --- |
| **Settings store** | `settings.ts` | Reads `app_settings` table, env fallback, secret masking on read. |
| **Twilio** | `twilio.ts` | SMS send, signature verify; reads credentials from settings. |
| **DocuSign** | `docusign.ts` | JWT-grant auth, envelope create + status, Connect HMAC verify. |
| **Email (SMTP)** | `email.ts` | Powers invite + notification emails via nodemailer. |
| **EagleView** | `eagleview.ts` | OAuth2 + report endpoints (ready for API key). |
| **QuickBooks Online** | `quickbooks.ts` | OAuth refresh + Invoice API (ready for API key). |
| **ABC Supply** | `abcSupply.ts` | Catalog + order API (ready for API key). |

Every service raises `ServiceUnavailable` with a descriptive message when its
backing credentials are unset, so the UI can surface "configure in Settings"
guidance instead of cryptic 500s.

### Database — Migrations

* `0002_full_suite_buildout.sql` — expands the user role enum to 13 roles
  (admin, manager, estimator, office, office_staff, sales_rep, project_lead,
  project_manager, production_manager, crew_lead, crew, subcontractor, client);
  adds `app_settings`; adds operational columns and `updated_at` to tasks,
  appointments, messages, warranties, inspections, contracts, reviews; seeds
  the integration + company-profile rows for `app_settings`.
* `0003_relax_warranty_constraints.sql` — drops the NOT NULL on
  `warranties.job_id / start_date / end_date` so warranties can be drafted
  ahead of (or independently from) a job.

A generated column `warranties.duration_years` mirrors `coverage_years` so the
frontend keeps reading `duration_years` without a code change.

### Frontend — CRM pages rebuilt

* `Tasks.jsx` — New Task dialog, status enum aligned to backend (`not_started`,
  `in_progress`, `completed`, `overdue`, `cancelled`).
* `Warranties.jsx` — New Warranty dialog (customer, type, coverage years,
  dates, manufacturer, notes).
* `Inspections.jsx` — New Inspection dialog with residential/commercial toggle
  and full service-type matrix (roofing, siding, windows, doors, gutters,
  storm_damage, exterior).
* `Messages.jsx` — Tabbed thread view + "Send SMS" panel calling Twilio.
* `Contracts.jsx` — New Contract dialog, signed/draft filters, "Send for
  signature" (DocuSign) action in the detail modal, deep-link to templates.
* `ContractTemplateBuilder.jsx` — List + edit contract templates; editing
  wraps `SmartDocumentEditor` and saves into the SmartDocs templates table.
* `CRMCalendar.jsx` — Switched to `scheduled_at` / `appointment_type` schema;
  added New Appointment dialog.
* `EmployeeManagement.jsx` — Roles dropdown matches the 12 staff roles in the
  DB enum; invite calls `functions.invoke('inviteEmployee', ...)`.
* `SettingsPage.jsx` — Tabbed surface: Profile, Integrations, Team, Dashboard.

### Frontend — New components

* `IntegrationsPanel.jsx` — admin-only console for Twilio, DocuSign, EagleView,
  QuickBooks, ABC Supply, and SMTP. Per-integration cards with masked secrets,
  enable toggle, and Save.
* `CompanyProfilePanel.jsx` — Company profile + brand colors persisted to the
  `company.profile` setting key.

### Security

* No secrets in source. Every credential flows through `app_settings`
  (admin/manager-gated) or env vars; the .env.example documents every variable.
* `is_secret` rows on `app_settings` are masked on read for non-admin users.
* DocuSign Connect webhook validates HMAC against `webhook_secret`.
* Twilio webhook validates `X-Twilio-Signature`.
* Bearer-auth pattern from existing routes carried into all new routes.
* CodeQL / Dependabot / branch protection settings unchanged — apply per the
  existing `SECURITY.md`.

### Deploy notes

1. **Backend (Enix Zo account)**
   * Pull `main`.
   * `cd backend && npm ci`.
   * Apply migrations: `npm run migrate` (runs `0002_full_suite_buildout.sql`
     and `0003_relax_warranty_constraints.sql` idempotently).
   * Restart the API service. No env changes are strictly required — the
     integration env vars are optional bootstraps; the canonical values live in
     `app_settings` once an admin signs in to Settings → Integrations.
   * Smoke test: `GET /api/health`, then `GET /api/tasks` and
     `GET /api/settings` with an admin session.

2. **Frontend (Cloudflare Pages, OpalClaw 1049 account)**
   * The Pages build pulls from `main` automatically.
   * Build command: `cd frontend && npm ci && npm run build`.
   * Output dir: `frontend/dist`.
   * Required Pages env vars: `VITE_API_BASE_URL=https://api.enixexteriors.com/api`
     (replace with your API host) and `VITE_LEAD_API_URL=/api/public/leads`.

3. **First admin login**
   * Promote the first registered user with `UPDATE users SET role='admin'
     WHERE email='...'` once.
   * Hit `/crm/settings` → Integrations and paste real Twilio / DocuSign /
     EagleView / QuickBooks / ABC Supply / SMTP credentials when they arrive.

## Verification (executed locally before push)

* `backend: npm run build` — clean.
* `backend: npm run typecheck` — clean.
* `backend: npm test` — 11/11 passing.
* `frontend: npm run lint` — clean.
* `frontend: npm run build` — clean.
* Postgres 15 migrations applied; all 15 list endpoints returned 200 against a
  fresh DB; representative POSTs against tasks, warranties, inspections,
  contracts, appointments, materials, crews, settings, and invite-client all
  returned 201/200.

## Known follow-ups (post-handoff)

* The three live integrations (EagleView, QuickBooks, ABC Supply) ship as
  fully-wired clients but cannot be smoke-tested until real credentials are
  available. Plug them in via Settings → Integrations and the existing routes
  pick them up.
* `Contracts → Send for signature` requires DocuSign credentials in Settings;
  the route returns a typed 503 with `service_unavailable` otherwise.
* Stripe payment-link generation lives in the existing `payments.ts` and is
  unchanged.
