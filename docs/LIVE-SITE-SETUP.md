# Enix Exteriors — Live Site & Lead SMS Setup

## What's live right now

### Frontend site
- **Service:** `enix-exteriors-site` (process mode, port 18724) — `service_id: svc_QEZ0b3NQQcA`
- **Entrypoint:** `bun run serve.ts` in `Documents/Enix/base44-original-code/`
- **Auto-restarts** on crash, persists across host restarts
- **Healthcheck:** `GET /healthz` → `200 ok`
- **Preview URL (ephemeral):** `http://p1.proxy.zo.computer:21511`

### Copy ported from the original GHL site
All public pages now use the original Enix Exteriors voice and content:
- **Hero** — "TOP COMMERCIAL ROOFING CONTRACTOR IN TENNESSEE" / "TENNESSEE'S TRUSTED ROOFING EXPERTS"
- **Service cards** — original one-liners for Residential, Commercial, Roof Repairs, Siding, Windows, Doors, Storm Damage
- **Commercial Roofing** — TPO, Modified Bitumen, Roof Coatings, Complete Replacement
- **Residential Roofing** — Shingle, Metal, Tile + 4-step process (Inspection → Quote → Install → Walkthrough)
- **Storm Damage** — Rapid Response, Emergency Tarping, Insurance Documentation, Claim Assistance + storm-damage signs checklist
- **Siding** — Vinyl, Fiber Cement, Engineered Wood, Insulated, Gutters & Downspouts, Soffit/Fascia
- **Windows** — Energy-efficient with proper flashing and sealing
- **Doors** — Entry, Patio, Storm, professional weatherproofing
- **About** — Original founding story, Knoxville → statewide, "Unique. Innovative. Forward." tagline, 6 values
- **Contact** — Real address (5992 Bearden View Ln, Knoxville TN 37909), INFO@ENIXEXTERIORS.COM, hours
- **Footer** — Matches original exactly
- **Education Hub (`/education`)** — All 50 articles from the GitHub repo wired in
- **Nav menu** — Education added between Reviews and Financing

### Lead intake API
- **Endpoint:** `https://opalsage.zo.space/api/enix-lead`
- **Method:** `POST` JSON
- **Behavior:**
  - Validates input (TCPA consent required, must have name/email/phone)
  - Sanitizes every field, drops control characters
  - Appends to `Documents/Enix/leads.json` with `notified: false`
- **Verified end-to-end:** ✅ tested with a real POST, lead persisted, response returned

---

## Lead → SMS pipeline (Zo automation)

**Automation:** `Send SMS Notifications for New Enix Exteriors Leads`
**ID:** `d2b6aa72-d08d-4a3a-9b81-19d4ac842de6`
**Schedule:** every 2 minutes
**Channel:** SMS

### How it works
1. A lead form submission posts to `/api/enix-lead` → stored with `notified: false`
2. Within 2 minutes, the Zo automation wakes up
3. It reads `Documents/Enix/leads.json`, finds every lead with `notified: false`
4. For each unnotified lead, it sends an SMS via Zo's native SMS to the workspace owner (OpalsSageLabs) with this format:
   ```
   🏠 NEW ENIX LEAD
   Name: ...
   Phone: ...
   Email: ...
   Service: ...
   Address: ...
   Notes: ...
   Received: ISO timestamp
   ```
5. After each SMS sends successfully, the automation marks that lead as `notified: true` with a `notified_at` timestamp and writes the file back
6. If there are no new leads, the automation stays silent (no SMS spam)

### Routing SMS to Enix's number instead of the owner
Right now SMS goes to the workspace owner (the only registered Zo contact). To route it to Enix Exteriors directly:

1. Add Enix Exteriors as a contact in [Settings → Channels](/?t=settings&s=channels) (name them `Enix Exteriors`, number `+18656853649`)
2. Tell me, and I'll edit the automation to use `contact_name="Enix Exteriors"` in the `send_sms_to_user` call

Until that's done, SMS lands on your phone and you can forward to Enix as needed.

### Cost note
Every 2 minutes = 720 runs/day. Each run is a Zo session; most will be near-empty since they'll find no unnotified leads. If you want to reduce frequency, edit the automation rrule (e.g. `FREQ=MINUTELY;INTERVAL=5` for every 5 minutes).

---

## How to check leads anytime

```
file 'Documents/Enix/leads.json'
```

Or:
```bash
cat /home/workspace/Documents/Enix/leads.json | jq
```

---

## Durable public URL — three options

The preview URL above is ephemeral. To get a permanent URL:

1. **Upgrade Zo plan** — Free plan allows 1 hosted HTTP service slot, already used by `opalsagelabs-click`. Upgrading adds more slots. After upgrade, run `update_user_service(service_id="svc_QEZ0b3NQQcA", mode="http", local_port=18724)` to convert to public HTTP, attach a custom domain like `enixexteriors.com`.
2. **Pause `opalsagelabs-click`** — frees the HTTP slot for Enix.
3. **Ask me to convert to Zo Space routes** — free, durable, but the React app's marketing pages would need a separate port.

---

## Service operations

```bash
# View site logs
tail -f /dev/shm/enix-exteriors-site.log

# Rebuild + restart pattern
cd Documents/Enix/base44-original-code && npm run build
# then update_user_service(service_id="svc_QEZ0b3NQQcA") to pick up new dist/

# Check the lead automation
list_automations  # or look in /?t=automations
```

---

## What's wired vs. what isn't

| Surface | Status |
|---------|--------|
| Public marketing pages (Home, About, Services, Reviews, Projects, Contact, Financing) | ✅ Live with original copy |
| Education Hub (`/education`, `/education/:slug`) | ✅ Live, all 50 articles |
| Privacy Policy + Terms | ✅ Live |
| Lead form submission | ✅ Live, posts to `https://opalsage.zo.space/api/enix-lead` |
| Lead persistence | ✅ `Documents/Enix/leads.json` |
| Lead SMS via Zo automation | ✅ Active, fires every 2 minutes for unnotified leads |
| Lead photo upload | ⚠️ Skipped silently — needs backend (Part B) for S3 storage. Form still submits without photos. |
| Client login / portal / CRM / SmartDocs | ⏸ Routes load but data layer needs Part B backend before these are usable. |
