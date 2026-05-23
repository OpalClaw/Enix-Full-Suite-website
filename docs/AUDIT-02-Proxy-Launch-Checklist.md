# Proxy URL Launch Clearance Checklist

**Current launch surface:** `http://p1.proxy.zo.computer:21511` (ephemeral, HTTP, set up by `proxy_local_service` on port 18724).

Each item is binary: YES it's good to go, or NO + the exact remediation step. Do not flip the launch switch until every line is YES.

## Code & build

- [x] `npm run build` succeeds clean
- [x] Production bundle in `dist/` — 2.7 MB, fingerprinted asset filenames
- [x] No source maps in production output (verified)
- [x] No `console.log` in client source paths
- [x] No hardcoded secrets in source (full grep clean)
- [x] No `dangerouslySetInnerHTML` without DOMPurify (verified — `BlogPost.jsx` and `chart.jsx` are both fine)
- [x] `.env.example` complete
- [x] `.env.local` present with `VITE_LEAD_API_URL`
- [x] `.gitignore` excludes `.env*` (verified)
- [x] No `TODO` / `FIXME` markers in critical paths (verified — only 2 informational comments in `generateJobNumbers/entry.ts`)
- [x] `npm audit` — 9 of 11 vulnerabilities patched; remaining 2 (`react-quill` chain) are in unreachable code

## Runtime

- [x] Service `enix-exteriors-site` is registered and auto-restarts
- [x] `/healthz` returns 200
- [x] Bun static server enforces path traversal protection (`safeJoin` confirmed)
- [x] SPA fallback returns index.html for unknown routes
- [x] Security headers on every response: CSP, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy denies camera/mic/geo, Cross-Origin-Opener-Policy same-origin
- [x] HSTS deliberately **off** (will pin clients to HTTPS prematurely while on HTTP proxy — turn on with `FORCE_HSTS=1` once domain is HTTPS)
- [x] Service logs go to `/dev/shm/enix-exteriors-site.log` (not local disk)

## Lead intake (`/api/enix-lead` on Zo Space)

- [x] JSON-only POST, OPTIONS preflight handled, other methods rejected with 405
- [x] Every input field sanitized (control chars stripped, length-capped per field)
- [x] Email and phone shape validated server-side
- [x] TCPA consent enforced server-side
- [x] Honeypot `website` field — bot fills it, server silently no-ops with fake success
- [x] User-Agent bot fingerprint filter
- [x] Rate limit: 5 successful requests per IP per 10 minutes
- [x] Lead appended atomically to `leads.json`
- [x] No stack traces or internal paths in error responses
- [x] CORS allows all origins (intentional — the API is the integration point for any future Enix domain)
- [x] No SQL/exec/eval surfaces — file write only

## SMS notification

- [x] Zo automation `Send SMS Notifications for New Enix Exteriors Leads` is active
- [x] Runs every 2 minutes
- [x] Reads `leads.json`, finds entries with `notified: false`, sends formatted SMS, marks notified
- [x] Stays silent on empty runs
- [ ] **NO** — SMS currently routes to workspace owner, not Enix Exteriors' phone. **Manual action required:**
  1. Go to [Settings → Channels](/?t=settings&s=channels)
  2. Add a contact named `Enix Exteriors`, phone `+18656853649`
  3. Tell me and I'll edit the automation to use `contact_name: "Enix Exteriors"` in its `send_sms_to_user` call

## Public marketing pages

- [x] All public copy ported from the original GHL site
- [x] Education Hub (`/education`) live with all 50 articles
- [x] Privacy Policy and Terms pages live
- [x] Education link in nav menu
- [x] Footer has Privacy / Terms / Sitemap links
- [x] Phone, email, address match the originals exactly
- [x] All `<img>` tags have meaningful `alt` attributes (verified)
- [x] All `<a href="tel:">` links have `aria-label` (verified)
- [x] Page titles set via `usePageTitle` on every public page
- [x] 404 page falls back to home button via `useNavigate`, not `window.location`
- [x] Error boundaries wrap the router and the public layout

## Auth-gated surfaces

- [x] `/login/client` and `/login/employee` carry an in-setup notice banner
- [x] Login forms do not crash if Base44 is unreachable — failures are caught and surfaced as toasts
- [ ] **NO** — Portal/CRM/SmartDocs routes will throw if a curious user navigates to them. **Manual action required, low priority:** either hide these from the router until Phase B backend is up, or add a 503 "in setup" component. Until then, they fail silently behind login and won't be discovered organically.

## External actions required before flipping the switch

Three items in the list above are flagged "NO". The two checkboxes above plus this third one for visibility:

1. **Add Enix as a Zo contact** so SMS lands on the right phone — 1 minute in Settings
2. **Decide on portal route handling** — either accept that gated routes will error if poked, or 503-gate them — 5 minutes if you want me to gate them
3. **Test the form from a real browser** on the proxy URL — submit one real lead, confirm SMS arrives, confirm `leads.json` records it. Click every nav link. Open every service page on mobile width. Anything unexpected blocks launch
