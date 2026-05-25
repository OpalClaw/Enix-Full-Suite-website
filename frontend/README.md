# Enix Frontend

The customer-facing marketing site, CRM dashboard, client portal, and
SmartDocs editor — one Vite + React SPA.

[![Vite](https://img.shields.io/badge/Vite-6-646cff)](https://vitejs.dev)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://react.dev)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8)](https://tailwindcss.com)

## Stack

- **Build:** Vite 6 + React 18
- **Styling:** Tailwind CSS 3.4 + shadcn/ui (Radix UI primitives)
- **State:** TanStack Query v5
- **Routing:** react-router-dom v6
- **Forms:** react-hook-form + Zod
- **PDF:** jspdf + html2canvas
- **Icons:** lucide-react

## Project layout

```
frontend/
├── public/                  # robots.txt, sitemap.xml, og-image, favicon
├── src/
│   ├── App.jsx              # Top-level routes (~70 routes)
│   ├── main.jsx             # Vite entry
│   ├── api/
│   │   ├── client.js        # Typed REST client (talks to backend/)
│   │   └── base44Client.js  # Shim — keeps old `import { base44 }` imports working
│   ├── pages/
│   │   ├── *.jsx            # 19 public marketing pages
│   │   ├── crm/             # 27 CRM dashboard pages
│   │   ├── portal/          # 11 client portal pages
│   │   └── smartdocs/       # 4 SmartDocs editor pages
│   ├── components/
│   │   ├── ui/              # shadcn/ui primitives
│   │   ├── public/          # Marketing-site components (incl. LeadForm)
│   │   ├── crm/             # CRM layout + widgets
│   │   ├── portal/          # Portal layout + widgets
│   │   └── ...
│   ├── hooks/               # Custom React hooks
│   ├── lib/
│   │   ├── articles.js      # 50 Education Hub articles (static data source)
│   │   ├── PageNotFound.jsx # Branded 404 page
│   │   └── ...
│   └── data/                # Other static data sources
├── index.html
├── vite.config.js           # Build, chunk-splitting, env validation
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
├── jsconfig.json
└── .env.example
```

## Local development

```bash
cp .env.example .env
# Edit .env — point VITE_API_BASE_URL at the running backend
npm install
npm run dev          # http://localhost:5173
```

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server with HMR on port 5173 |
| `npm run build` | Production build to `dist/` (fails if required envs missing) |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | ESLint check (zero-error policy) |
| `npm run lint:fix` | Auto-fix style + unused-import issues |
| `npm run typecheck` | `tsc -p ./jsconfig.json` |

## Environment variables

| Variable | Required | Purpose |
| --- | :-: | --- |
| `VITE_API_BASE_URL` | ✅ (prod) | Backend API base URL |
| `VITE_LEAD_API_URL` | ✅ (prod) | Public lead-intake endpoint |
| `VITE_BACKEND_ENABLED` | | `"true"` to enable CRM + portal routes |
| `VITE_SITE_NAME` | | Site title in OG / nav |
| `VITE_SITE_URL` | | Canonical site URL |
| `VITE_CONTACT_PHONE` | | Header / footer phone |
| `VITE_CONTACT_EMAIL` | | Footer contact email |
| `VITE_STRIPE_PUBLISHABLE_KEY` | | Portal payment form |
| `VITE_TURNSTILE_SITE_KEY` | | Lead-form bot challenge |
| `VITE_PLAUSIBLE_DOMAIN` | | Plausible analytics |
| `VITE_GA4_MEASUREMENT_ID` | | Google Analytics 4 |
| `VITE_PRODUCTION_SOURCEMAPS` | | `"true"` to include source maps in prod |

**Production build fails fast** if `VITE_API_BASE_URL` or
`VITE_LEAD_API_URL` is missing (see `vite.config.js`).

## Routes

### Public (~19)
`/`, `/about`, `/residential-roofing`, `/commercial-roofing`,
`/roof-repairs`, `/siding`, `/windows`, `/doors`, `/storm-damage`,
`/projects`, `/reviews`, `/financing`, `/contact`, `/education`,
`/education/:slug`, `/privacy-policy`, `/terms`, plus login pages.

### CRM (~27)
`/crm`, `/crm/leads`, `/crm/leads/new`, `/crm/leads/:leadId`,
`/crm/jobs`, `/crm/jobs/:jobId`, `/crm/inspections`,
`/crm/measurements`, `/crm/estimates`, `/crm/estimate-templates`,
`/crm/contracts`, `/crm/calendar`, `/crm/crew`, `/crm/materials`,
`/crm/messages`, `/crm/tasks`, `/crm/invoices`, `/crm/proposals`,
`/crm/warranties`, `/crm/reports`, `/crm/commercial-estimates`,
`/crm/settings`.

### Client portal (~11)
`/portal`, `/portal/project`, `/portal/media`, `/portal/messages`,
`/portal/documents`, `/portal/estimates`, `/portal/invoices`,
`/portal/changes`, `/portal/warranty`, `/portal/support`.

### SmartDocs (~4)
`/crm/jobs/documents`, `/crm/jobs/documents/editor`,
`/crm/jobs/documents/editor/:documentId`, `/crm/jobs/documents/templates`,
plus public `/sign/:documentId/:signerToken`.

### 404
`*` → `PageNotFound` (branded, navigable). No blank screens.

## Lead form (`src/components/public/LeadForm.jsx`)

The site's primary conversion mechanism. Hardened against:

- **Empty submission** — per-field validation with `aria-describedby`
  error messages.
- **Invalid email / phone** — regex + minimum-7-digits check.
- **SQL injection in `name`** — sent as a JSON string; backend layers
  validate with Zod. Frontend has no SQL exposure.
- **10,000-char message** — `maxLength` enforced on textarea.
- **Double submission** — `submitting` flag disables every input and
  the submit button while in-flight.
- **Bot detection** — forms submitted < 3 seconds after mount are
  silently no-op'd ("submitted" UI but nothing stored).
- **Unreachable API** — user-friendly toast + phone number fallback.
- **Accessibility** — labels associated with inputs, error text linked
  via `aria-describedby`, tab order logical.

## Blog / Education Hub

Static data source: `src/lib/articles.js` exports `ARTICLE_DATA` —
**50 full articles**, each with `id`, `title`, `category`, `content`
(≥600 words), `keywords`, `meta_description`, plus computed
`slug` / `excerpt` / `readTime` helpers.

Categories: Contractor Guide, Residential, Commercial, Storm Damage,
Insurance, Maintenance, Roof Components, Exterior, Local TN.

Adding a new article: append a new object to `ARTICLE_DATA` in
`src/lib/articles.js`. URL slug auto-derives from the title via
`slugify()`. No code changes needed — `/education` indexes
automatically; `/education/:slug` resolves automatically.

## Build artifacts

A production build produces `dist/`:

```
dist/
├── index.html            (~4.5 KB)
├── assets/
│   ├── index-*.js        (main bundle)
│   ├── vendor-react-*.js
│   ├── vendor-radix-*.js
│   ├── vendor-query-*.js
│   ├── vendor-charts-*.js
│   ├── vendor-pdf-*.js
│   ├── vendor-icons-*.js
│   ├── vendor-three-*.js
│   └── index-*.css       (Tailwind atomic)
├── robots.txt
└── sitemap.xml
```

Chunk-splitting is configured in `vite.config.js` — large vendor
libraries are their own files so app changes don't bust their cache.

## Deploy — Cloudflare Pages

1. Connect this repo to Cloudflare Pages.
2. **Build command:** `cd frontend && npm install && npm run build`
3. **Build output:** `frontend/dist`
4. **Environment variables** (Pages → Settings → Environment):
   - `VITE_API_BASE_URL` (e.g. `https://api.enixexteriors.com/api`)
   - `VITE_LEAD_API_URL` (e.g. `https://leads.enixexteriors.com/api/enix-lead`)
   - `VITE_BACKEND_ENABLED=true`
   - …all other `VITE_*` as needed
5. **SPA fallback** — Cloudflare Pages auto-detects `index.html` and
   serves it for any unmatched route. If you need explicit config, add
   `_redirects` with `/* /index.html 200`.

## Deploy — Zo Space

`frontend/serve.ts` provides a hardened static server with CSP, HSTS,
MIME enforcement, SPA fallback, `/healthz`, and security headers. To
serve the built `dist/` from Zo Space, wrap it as a service:

```ts
// service entrypoint
import serve from "./serve.ts";
export default serve({ root: "./dist", port: 3000 });
```

## Performance / Lighthouse

Target on the marketing pages:

- **Performance** ≥ 90
- **Accessibility** ≥ 95 (no contrast failures, labelled inputs, alt text)
- **Best Practices** ≥ 95 (HTTPS-only via Cloudflare, no console errors,
  CSP via `serve.ts`)
- **SEO** ≥ 95 (canonical, OG tags, structured data in `index.html`)

Run locally with `npx lighthouse https://localhost:4173 --view`.
