# Contributing to Enix Exteriors Full Suite

Thank you for considering a contribution. This monorepo ships
production-grade roofing/exterior software. We hold every change to
enterprise standards.

## Code of Conduct

This project adopts the [Contributor Covenant](./CODE_OF_CONDUCT.md).

## Development environment

Prerequisites:

- Node.js **>= 20** (use `nvm use 20`)
- Bun **>= 1.1** (for `leads-api/`)
- PostgreSQL **>= 15** (for `backend/`)
- Docker (optional — for Postgres locally)

Bootstrap:

```bash
git clone git@github.com:OpalClaw/Enix-Full-Suite-website.git
cd Enix-Full-Suite-website
make install          # installs all three components
make db-up            # boots local Postgres in Docker
make migrate          # runs Drizzle migrations
make dev              # runs all three dev servers concurrently
```

See each component's `README.md` for component-specific details.

## Workflow

1. **Issue first.** Open an issue describing the change before opening a PR for
   anything beyond a typo. Use the appropriate issue template.
2. **Branch naming.** `feat/<scope>`, `fix/<scope>`, `chore/<scope>`,
   `security/<scope>`, `docs/<scope>`.
3. **Conventional Commits.** Every commit must follow
   [conventionalcommits.org](https://www.conventionalcommits.org/):
   - `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `perf:`, `test:`,
     `build:`, `ci:`, `chore:`, `security:`, `revert:`
4. **Small PRs.** Prefer many small PRs over one large one. Each PR must
   compile, type-check, lint, and test green before review.
5. **Required checks.** The CI pipeline runs `lint`, `typecheck`, `test`,
   `audit`, `secret-scan`, and `codeql` on every PR. All must pass.

## Coding standards

### TypeScript (backend, leads-api)

- `strict: true` is mandatory. `noImplicitAny`, `strictNullChecks`,
  `noUnusedLocals`, `noUnusedParameters` are enforced.
- No `any` types. Prefer `unknown` + narrowing. If you genuinely need
  `any`, justify it with an inline comment.
- Every public function gets a JSDoc block when non-obvious.
- Errors propagate via `next(err)` (Express) or thrown HTTPError (Hono);
  routes are wrapped in `try/catch`.

### React (frontend)

- Functional components only.
- All side effects in `useEffect` with explicit dependency arrays.
- No direct DOM (`document.getElementById`); use refs.
- No `console.log` in committed code — use the logger or remove.

### Database

- Migrations are append-only. Never edit an applied migration.
- All tenant-scoped columns get `NOT NULL` constraints.
- Compound indexes match query patterns; review with `EXPLAIN ANALYZE`.

### Security

- **Zero hardcoded secrets.** Use environment variables. Reference them via
  the typed env loader.
- **Zod `.strict()`** on every public-facing request body schema.
- **Parameterized queries only.** No string interpolation in SQL.
- **Auth + tenant context** middleware on every data route.
- **OWASP Top 10** — every PR is reviewed for these specific risks.

## Testing

- New code paths must include tests. Aim for ≥80% line coverage on
  changed files.
- Integration tests live in `tests/integration/`; unit tests live
  alongside source as `*.test.ts`.
- For tenant-isolation code, write the **negative test** first
  (tenant A trying to read tenant B's data).

## Reporting bugs

Use the `Bug Report` issue template. Include:

- Component (`frontend` / `backend` / `leads-api`)
- Steps to reproduce
- Expected vs actual behavior
- Logs (with secrets redacted)

## Reporting security issues

**Never open a public issue for a security vulnerability.** Use the
disclosure process in [`SECURITY.md`](./SECURITY.md).

## License

By contributing, you agree your contributions are licensed under the
[MIT License](./LICENSE).
