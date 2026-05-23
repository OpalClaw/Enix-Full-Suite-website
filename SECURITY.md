# Enix Exteriors — Security Posture

Summary of the security defenses in place across the stack and the audit history.

## Defense matrix

| Layer | Threat | Defense |
|-------|--------|---------|
| Edge | DDoS, bot floods | Cloudflare WAF, rate limiting |
| Edge | TLS strip | HSTS preload (when `FORCE_HSTS=1`), Cloudflare-managed certs |
| Frontend | XSS | DOMPurify on all `dangerouslySetInnerHTML` (article content), strict CSP, X-Content-Type-Options nosniff |
| Frontend | Clickjacking | X-Frame-Options DENY, frame-ancestors 'none' |
| Frontend | MIME confusion | nosniff + explicit Content-Type per asset |
| Frontend | Cross-site requests | Strict-Origin-When-Cross-Origin Referrer-Policy, COOP same-origin |
| Frontend | Browser API abuse | Permissions-Policy disabling camera, mic, geolocation by default |
| Lead API | Form spam | Per-IP rate limit (5/10min), honeypot, bot UA filter |
| Lead API | Cross-origin abuse | Strict origin allowlist (CORS) |
| Lead API | Compliance | TCPA consent required, rejected if missing |
| Lead API | Bad payloads | Sanitized inputs (control char strip + max length), email/phone shape checks |
| Lead API | Privacy | No PII in logs; IP and UA stored only on the lead record for fraud forensics |
| Admin export | Unauthenticated access | Bearer token (constant-time compare), 401 by default |
| Backend | SQL injection | Drizzle parameterized queries everywhere; no raw concatenation |
| Backend | Auth bypass | requireAuth + requireRole middleware on every protected route |
| Backend | Stolen tokens | Short-lived access JWTs (15m), refresh tokens hashed at rest + revocable |
| Backend | Password attacks | Argon2id with safe defaults (memoryCost=64MB, timeCost=3) |
| Backend | CSRF | SameSite=Strict cookies + Origin checks |
| Backend | Mass-assignment | Zod schemas validate every payload; only whitelisted fields accepted |
| Backend | Information leakage | Pino redact lists scrub password, token, authorization, cookie, secret keys from logs |
| Backend | DoS | Body size limits, Helmet defaults, optional reverse-proxy rate limiting |
| Process | Secret leakage | `.env*` in `.gitignore`; no secrets in code or commits |
| Process | Dependency CVEs | `npm audit` clean for frontend except 2 moderate react-quill advisories (route gated until Phase B) |

## Audit history

The codebase passed a hostile production audit in May 2026. Detailed reports:

- `docs/AUDIT-01-Scorecard.md` — Overall readiness scorecard
- `docs/AUDIT-02-Proxy-Launch-Checklist.md` — Pre-launch checklist (proxy preview)
- `docs/AUDIT-03-Permanent-Domain-Migration.md` — Cutover to production domain
- `docs/AUDIT-04-Known-Gaps.md` — Known gaps register with owners

## Secret management

Never commit:
- `.env`, `.env.local`, `.env.production`
- `*.key`, `*.pem`, `id_rsa*`
- `leads.json` if it contains real PII
- Any file matching the platform's secret patterns

Required secrets (rotate annually or immediately on compromise):
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `DATABASE_URL` (password component)
- `ENIX_LEADS_EXPORT_TOKEN`

Generate any random secret: `openssl rand -hex 32`

## Incident response

| Severity | Response time | Action |
|----------|---------------|--------|
| Critical (e.g. credential leak, DB compromise) | <15 min | Rotate all secrets, force-revoke refresh tokens (`DELETE FROM refresh_tokens`), notify affected users if PII exposed |
| High (e.g. service down >5 min) | <1 hour | Restart service, check logs, escalate to engineer |
| Medium (e.g. elevated error rate) | <4 hours | Investigate, patch, communicate |
| Low (e.g. dependency advisory) | <30 days | Upgrade in next release |

## Reporting a vulnerability

Email security@enixexteriors.com with a description and reproduction steps. Acknowledgement within 48 hours.
