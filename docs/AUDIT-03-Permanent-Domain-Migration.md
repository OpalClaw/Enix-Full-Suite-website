# Permanent Domain Migration Checklist

When the proxy URL (`http://p1.proxy.zo.computer:21511`) is retired and the real Enix Exteriors domain (e.g. `enixexteriors.com`) becomes the production surface, run through this list **in order**.

Anything that's a one-line code change is listed with the exact diff. Anything that's a config or infra step is listed with the exact action.

## 1. Stand up HTTPS on the real domain

1. Upgrade Zo plan to free a hosted HTTP service slot, **or** pause `opalsagelabs-click` to free the existing slot.
2. Convert the site to a public HTTP user service:
   ```
   update_user_service(
     service_id="svc_QEZ0b3NQQcA",
     mode="http",
     local_port=18724,
     public="true",
   )
   ```
3. Add the custom domain in the service detail panel ([Sites & Services](/?t=sites&s=services))
4. Configure DNS at the registrar:
   - `enixexteriors.com` → CNAME or A to the service's domain target
   - `www.enixexteriors.com` → same target
5. Confirm the TLS cert provisions automatically (Zo handles this)
6. Verify `https://enixexteriors.com` returns 200 with valid cert

## 2. Turn on HSTS

Once HTTPS is verified working **and** you're committed to staying on HTTPS forever:

```
update_user_service(
  service_id="svc_QEZ0b3NQQcA",
  env_vars={"NODE_ENV": "production", "PORT": "18724", "FORCE_HSTS": "1"},
)
```

This makes `serve.ts` emit `Strict-Transport-Security: max-age=31536000; includeSubDomains` on every response.

⚠️ **Do not** enable HSTS before HTTPS is solid — browsers will cache the policy and refuse to load the site if HTTPS breaks.

## 3. Update the lead form endpoint

If the lead API is moved off Zo Space (e.g. served directly from the new domain at `/api/lead`):

1. Edit `.env.local` and the deployment env:
   ```
   VITE_LEAD_API_URL=https://enixexteriors.com/api/lead
   ```
2. Rebuild and update the service:
   ```
   cd Documents/Enix/base44-original-code && npm run build
   update_user_service(service_id="svc_QEZ0b3NQQcA")
   ```

If the lead API stays on Zo Space, this step is a no-op — the existing value already works.

## 4. Tighten CSP `connect-src`

Edit `serve.ts`, the `CSP_DIRECTIVES` constant. Replace:
```
"connect-src 'self' https://opalsage.zo.space https://*.zo.computer https://api.zo.computer",
```
with the exact origin(s) the production app will call. For example, if the lead API moves to the same domain:
```
"connect-src 'self'",
```
Then rebuild and update the service.

## 5. Tighten CORS on the lead API

If the lead API is staying on Zo Space, edit `/api/enix-lead` and replace `Access-Control-Allow-Origin: *` in the OPTIONS handler with:
```
"Access-Control-Allow-Origin": "https://enixexteriors.com"
```

Same for the response on POSTs if you add explicit CORS there.

## 6. Replace honeypot+rate-limit with a real CAPTCHA

Once the domain is on Cloudflare:
1. Enable Cloudflare Turnstile for `enixexteriors.com`
2. Get the site key and secret key
3. Add `<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async></script>` to `index.html`
4. Add the Turnstile widget to `LeadForm.jsx`
5. Add Turnstile secret verification to `/api/enix-lead`

## 7. Move PII storage off the workspace file

`leads.json` is acceptable for the first 50 leads. Past that:
1. Set up PostgreSQL (Zo's hosted Postgres, Neon, Supabase, or self-hosted on a VPS)
2. Migrate the lead route to write to Postgres instead of JSON
3. Backfill existing JSON leads into Postgres in a single migration script
4. Keep `leads.json` for one week as a backup, then archive

## 8. Update OAuth redirect URIs (if any)

Currently none — Base44 is offline and there's no Google/GitHub/Facebook OAuth in the live surface. Skip until OAuth is added.

## 9. Update analytics / tracking domain allowlists (if added)

Currently no analytics is wired. If you add Google Analytics, Plausible, or anything similar before the cutover, register the new domain in that tool's dashboard.

## 10. SEO and indexing

1. Update `index.html` `<link rel="canonical">` if added
2. Submit the new sitemap to Google Search Console under the new domain
3. Add a `robots.txt` if it isn't already in `dist/`
4. Update `og:url` and Twitter card URLs to the new domain
5. Set up a 301 redirect from the proxy URL to the new domain for any inbound traffic

## 11. SMS automation routing

After Enix is added as a Zo contact (see Proxy Launch Checklist), edit the automation instruction to route SMS to `Enix Exteriors` instead of the workspace owner.

## 12. Smoke test

1. From a clean browser session, hit the new domain
2. Click every nav link
3. Submit a real lead with TCPA consent
4. Confirm SMS arrives at Enix's phone within 2 minutes
5. Confirm `leads.json` (or the new database) recorded the lead
6. Confirm the `notified: true` flag flipped after SMS
7. Open every service page on mobile width
8. Test the 404 page (visit `/this-does-not-exist`)
9. Test that the in-setup notice still shows on `/login/client` until Phase B is up
