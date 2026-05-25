# Security Policy

## Supported versions

| Version | Status |
| --- | --- |
| `1.x` | ✅ Actively maintained — receives security patches |
| `< 1.0` | ❌ Pre-release, unsupported |

## Reporting a vulnerability

**Do not open a public issue for a security vulnerability.**

Email **OpalClaw@opalsagelabs.click** with:

- A description of the issue and its impact
- Steps to reproduce (proof-of-concept code or commands welcome)
- The affected component (`frontend`, `backend`, `leads-api`) and version /
  commit SHA
- Your name and a way to credit you (optional)

We acknowledge reports within **2 business days** and aim to ship a fix
within **30 days** for HIGH/CRITICAL issues. We coordinate disclosure
with the reporter.

## PGP

If you require an encrypted channel, request our PGP key by emailing the
address above. We will respond with our current key fingerprint.

## In-scope

- Authentication and authorization bypass on the `backend` API
- Multi-tenant isolation failures (any path by which tenant A can access
  tenant B data)
- SQL injection, XSS, CSRF, SSRF, RCE in any component
- Secret exposure in logs, error responses, or repository history
- Privilege escalation (employee → admin, client → employee)
- CSV-injection or formula-injection in exports
- Path traversal on document/file endpoints
- Cryptographic weaknesses (broken random, weak password hashing,
  algorithm confusion)
- Dependency vulnerabilities with a clear exploitable path

## Out of scope

- Self-XSS that requires user paste of attacker-controlled JS into devtools
- Reports from automated scanners without a reproducible PoC
- Missing security headers on static marketing assets where there is no
  practical attack
- Rate-limiting concerns on unauthenticated public endpoints below
  business-impact threshold (we are aware; tune as needed)
- Social-engineering or physical-access attacks
- Denial-of-service via overwhelming traffic from a single IP

## Threat model

See [`docs/THREAT_MODEL.md`](./docs/THREAT_MODEL.md) for the STRIDE
analysis. Highlights:

| Threat | Mitigation |
| --- | --- |
| **Spoofing** auth | JWT with `algorithms: ["HS256"]` allowlist, separate access + refresh secrets, refresh-token rotation with reuse detection |
| **Tampering** at rest | RLS-isolated Postgres rows, append-only `activity_log`, integrity hashes on signed documents |
| **Repudiation** | Activity log with `actor_id`, `tenant_id`, `before` / `after` JSON snapshots |
| **Information disclosure** | Tenant context middleware on every data route, generic 404 (not 403) for cross-tenant access, redacted error messages in production |
| **Denial of service** | Per-route rate limits, payload-size cap (1MB), graceful shutdown, body-parser limits |
| **Elevation of privilege** | Role allowlist per route, server-side role check (never trust client) |

## Defense-in-depth checklist

This is the **enforced** security baseline; CI fails on regressions:

- [x] All secrets in environment variables (never source / commit history)
- [x] Zod `.strict()` on every public request body schema
- [x] Parameterized queries only (Drizzle ORM — no raw SQL string concat)
- [x] CORS allowlist (no `*` on data endpoints)
- [x] Helmet headers: HSTS, frame-deny, no-sniff, referrer-policy,
      permissions-policy, COOP
- [x] argon2id password hashing (memCost ≥ 19MB, timeCost ≥ 2)
- [x] Constant-time secret comparison (`crypto.timingSafeEqual`)
- [x] CSV-injection escape on all exports (leading `=`, `+`, `-`, `@`,
      `\t`, `\r` get prefixed with `'`)
- [x] Account lockout after 5 failed login attempts / 15 minutes
- [x] Refresh-token reuse revokes the entire session family
- [x] Payload-size cap (1 MB) on JSON body parser
- [x] Trust-proxy = 1 (Cloudflare / Nginx in front)
- [x] x-powered-by header disabled
- [x] CodeQL + gitleaks + npm audit + license-check on every PR
- [x] Dependabot enabled on all three components + GH Actions

## Past advisories

None published. See `CHANGELOG.md` for security-tagged fixes.
