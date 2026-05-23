# Known Gaps Register

Numbered list of everything I couldn't fully verify, fix, or close in this audit. Each entry: what, why it matters, who owns it.

---

### 1. Base44 backend is not running

**What:** The original CRM, client portal, and SmartDocs surfaces all depend on `@base44/sdk` calls. There is no Base44 service in this workspace, so every `base44.entities.*`, `base44.auth.*`, and `base44.functions.invoke(...)` call will fail at runtime.

**Why it matters:** Logged-in flows are non-functional. A user who navigates to `/portal`, `/crm`, `/smartdocs`, `/clients`, `/employees`, etc. will see component errors caught by the global error boundary.

**Owner:** Phase B build (Express/Postgres/JWT). Until then, login pages carry an in-setup notice, but the routes themselves are still mounted. If you want them gated by a 503 page now, ask.

---

### 2. SMS notification routing target

**What:** The Zo automation sends SMS to whoever is registered as the workspace owner (OpalsSageLabs / +19128032471). Enix Exteriors' real number (+18656853649) is not yet a registered Zo contact.

**Why it matters:** The whole point of the lead alert is to land on the right phone. Right now you're the relay.

**Owner:** OpalsSageLabs to register `Enix Exteriors` as a contact in [Settings → Channels](/?t=settings&s=channels). I'll edit the automation once that's done.

---

### 3. Photo upload silently drops files

**What:** `LeadForm.jsx` calls `base44.integrations.Core.UploadFile({ file })` in `handlePhotoUpload`. With Base44 offline this throws and we catch it silently. The lead still submits but with `photo_count: 0`.

**Why it matters:** Customers can upload damage photos, see the thumbnails, and have no idea their photos didn't make it.

**Owner:** Phase B. Workaround if you want it sooner: replace the Base44 upload with a direct S3 PUT or a multipart POST to a Zo Space route that streams to a configurable bucket.

---

### 4. `leads.json` is the only datastore

**What:** All leads sit in a single JSON file on the workspace filesystem.

**Why it matters:** No transaction safety beyond filesystem-level write atomicity. No backup. No query capability. No multi-writer protection (the API is single-writer through the Zo Space process, so OK for now, but doesn't scale).

**Owner:** Phase B — move to PostgreSQL.

---

### 5. The proxy URL is HTTP, not HTTPS

**What:** `proxy_local_service` returns `http://p1.proxy.zo.computer:21511`.

**Why it matters:** Browsers will not show a padlock. SEO crawlers down-rank HTTP. Forms over HTTP trigger trust warnings in some browsers.

**Owner:** OpalsSageLabs decision — either accept HTTP for the temporary preview, or upgrade plan / free HTTP service slot to get HTTPS via a custom domain. The migration steps are in `AUDIT-03-Permanent-Domain-Migration.md`.

---

### 6. No automated test suite

**What:** This codebase ships with eslint config but no Jest / Vitest / Playwright tests.

**Why it matters:** Every refactor lands without regression coverage. Manual smoke testing is the only safety net.

**Owner:** Backlog. Recommend adding Vitest unit tests for `LeadForm`, the lead API route, and the article slug helper as a first beachhead.

---

### 7. Bundle size

**What:** `dist/assets/index-*.js` is 2.4 MB uncompressed. Single chunk, no code splitting.

**Why it matters:** Slow first paint on mobile / 3G. Not a launch blocker, but a performance fix worth scheduling.

**Owner:** Backlog. Vite's `manualChunks` config plus route-level `React.lazy()` for the CRM/Portal/SmartDocs surfaces would halve this.

---

### 8. Two remaining npm vulnerabilities

**What:** `react-quill` chain has 2 moderate XSS-in-quill advisories. Fix requires a breaking change (`react-quill@0.0.2` would actually be the only patched version, and that's a downgrade).

**Why it matters:** `react-quill` is used inside SmartDocs editor (`SmartDocumentEditor.jsx`). That surface is behind employee login, behind Base44 backend that's offline. **Currently unreachable**, so not a launch blocker.

**Owner:** Phase B — swap `react-quill` for a maintained editor (TipTap, Lexical) when re-enabling SmartDocs.

---

### 9. No global API client / fetch wrapper

**What:** Every component that calls Base44 or fetch does it raw, with its own error handling.

**Why it matters:** Inconsistent error messages, no central retry logic, no central instrumentation. New components will keep re-inventing this.

**Owner:** Refactor backlog. Recommend a `src/lib/api.ts` wrapper around fetch + TanStack Query.

---

### 10. No structured logging

**What:** `console.log` / `console.error` only. No JSON-structured logs, no request IDs, no correlation between a lead submit and the SMS that fires.

**Why it matters:** If a lead is lost between API and SMS, you'll have to grep `leads.json` and the automation logs to debug. Tedious but workable for v1.

**Owner:** Backlog. Add `pino` or similar once volume justifies it.

---

### 11. No CAPTCHA on the public form

**What:** Form is protected by honeypot + UA fingerprint + rate limit. No challenge.

**Why it matters:** Determined attackers can defeat all three. Sustained low-volume distributed spam is possible.

**Owner:** Add Cloudflare Turnstile once the domain is on Cloudflare. See migration checklist.

---

### 12. No accessibility audit by tool

**What:** I verified `alt` attributes, `aria-label` on tel: links, and `usePageTitle` everywhere. I did not run axe-core or Lighthouse against the live site.

**Why it matters:** Color contrast, focus order, screen reader behavior, and form-label associations are not formally verified.

**Owner:** OpalsSageLabs to run Lighthouse on the proxy URL before launch. Anything below 90 on Accessibility is a fix-before-flip.

---

### 13. No analytics

**What:** No pageview tracking, conversion tracking, or session attribution.

**Why it matters:** You won't know if anyone visits or where they drop off.

**Owner:** Product decision — pick Plausible / GA4 / Fathom and add it before launch if you want measurement from day one.
