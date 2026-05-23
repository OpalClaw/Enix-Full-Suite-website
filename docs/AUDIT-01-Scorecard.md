# Production Readiness Scorecard — Enix Exteriors

**Audit date:** 2026-05-22
**Scope:** Frontend SPA + Zo Space lead intake + Zo SMS automation. Base44-backed CRM/Portal/SmartDocs surfaces are deferred to Phase B.

## Phase scores

| Phase | Score (/10) | Status |
|-------|-------------|--------|
| 0 — Orient (map of stack/data/deps) | 10 | Full file tree generated, 271 source files mapped, stack and data model captured |
| 1 — Logic & Completeness | 7 | Public marketing surfaces are complete; CRM/Portal/SmartDocs are wired but their data layer (Base44) is offline. Two cosmetic placeholders only |
| 2 — Security (zero trust) | 7 | Headers, CSP, rate limit, honeypot, sanitization in place. No HSTS yet (HTTP proxy). 2 moderate npm vulns left in react-quill chain |
| 3 — Proxy URL Hardening | 5 | Site runs over HTTP proxy. Mixed-content risk minimized because all third-party calls already use HTTPS. CORS open for the lead API by design. **HSTS deliberately off** until permanent HTTPS domain is in place |
| 4 — Backend & API (lead intake) | 8 | Validates, sanitizes, rate-limits, honeypots, idempotent storage. Stack traces never returned. File-based persistence is the known temporary substitute for Postgres |
| 5 — Frontend | 7 | Error boundaries in place, page titles wired, DOMPurify guarding the only `dangerouslySetInnerHTML`. Bundle is 2.4 MB single chunk — not blocking but flagged |
| 6 — DevOps & Build | 7 | `.env.example` documented, `.gitignore` excludes secrets, no source maps in prod, `/healthz` exposed, service auto-restarts. Logs land in `/dev/shm/enix-exteriors-site.log` |
| **Overall** | **7.0 / 10** | **Launch-eligible on the temporary HTTP proxy URL with the gaps below understood** |

## Top 5 launch blockers (by severity)

1. **HTTP-only proxy URL** — Lead form posts payment-relevant PII (name + address + email + phone) over HTTPS to the API, but the page itself loads over HTTP. Browsers will not throw mixed-content on this specific direction, but **forms over HTTP are a bad signal** for trust, SEO, and any future card/payment widget. Status: documented launch caveat, fix path = permanent domain with HTTPS.
2. **No durable backup of `leads.json`** — Single file in workspace storage. A crash, a `rm -f`, or a workspace restore would wipe leads. Status: needs an off-host sync (S3, email-on-receive, or git commit per lead) before any significant volume.
3. **Base44 backend offline** — CRM, Portal, SmartDocs routes will throw on every data call. Public users won't hit these unless they navigate to `/portal` or a login. Status: login pages now carry an in-setup notice; non-public surfaces are not advertised in nav.
4. **No CAPTCHA on the lead form** — Honeypot + rate limit + bot UA detection are layered, but a determined attacker can defeat all three. Status: ready to slot in Cloudflare Turnstile when the permanent domain is on Cloudflare.
5. **Lead → SMS routes to the workspace owner, not to Enix's phone** — Until "Enix Exteriors" is added as a Zo contact in [Settings → Channels](/?t=settings&s=channels), SMS goes to OpalsSageLabs's number. Status: documented; one-line edit to the automation once the contact exists.

## Top 3 security risks (severity-rated)

1. **HIGH — Lead intake endpoint is unauthenticated.** Mitigated by rate limit (5/IP/10min), honeypot, bot UA filter, server-side validation, no SQL/no exec surfaces. Residual risk: storage growth from sustained low-volume distributed attack. Mitigation if it happens: trim leads.json or rotate the endpoint path.
2. **HIGH — PII in plain JSON at rest.** `leads.json` contains names, emails, phones, addresses without encryption. Acceptable for prototype scale but **not** acceptable past first 50 real leads. Migrate to PostgreSQL with encryption-at-rest and audit logging as part of Phase B.
3. **MODERATE — Two npm vulnerabilities remain.** `react-quill` (pulls vulnerable `quill`). Surface area in production: only used inside SmartDocs editor, which is gated behind employee login. With Base44 offline, this code path is unreachable from the public site. Plan: replace `react-quill` with a maintained editor before re-enabling SmartDocs.
