<!--
Thank you for the PR. Fill out every section. Drafts welcome.
-->

## Summary

<!-- One sentence describing what this PR changes. -->

## Type of change

- [ ] `feat` — new feature
- [ ] `fix` — bug fix
- [ ] `docs` — documentation
- [ ] `refactor` — internal change, no behavior change
- [ ] `perf` — performance improvement
- [ ] `security` — security fix or hardening
- [ ] `test` — tests only
- [ ] `chore` / `build` / `ci` — tooling

## Component(s) touched

- [ ] `frontend/`
- [ ] `backend/`
- [ ] `leads-api/`
- [ ] root / docs / CI

## Description

<!-- What does this PR do and why? Link the issue. -->

Closes #

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed (describe below)
- [ ] Tested on multiple viewports (375 / 768 / 1024 / 1440)

<!-- Describe manual test steps if applicable -->

## Security review

- [ ] No new secrets in source, config, or commit history
- [ ] All new public endpoints have auth + tenant context middleware
- [ ] All new request schemas use Zod `.strict()`
- [ ] No raw SQL string interpolation
- [ ] No new dependencies with known HIGH/CRITICAL CVEs
- [ ] OWASP Top 10 reviewed for this change

## Documentation

- [ ] README updated if user-facing behavior changed
- [ ] `docs/API.md` updated if endpoints added/changed
- [ ] `.env.example` updated if new env vars introduced
- [ ] CHANGELOG.md updated

## Breaking changes

- [ ] None
- [ ] Yes — described in CHANGELOG.md with migration steps

## Checklist

- [ ] CI is green
- [ ] `pnpm typecheck` / `bun typecheck` / `npm run typecheck` passes
- [ ] Lint is clean
- [ ] Commit messages follow Conventional Commits
