# Multi-Tenancy Contract

The Enix Exteriors platform ships **single-tenant by default** (one
deployment per roofing company) but is **architected for multi-tenant
SaaS** from day one. This document describes the contract every component
must honour, and the migration path from single to multi-tenant.

## Vocabulary

| Term | Meaning |
| --- | --- |
| **Tenant** | A roofing company. Owns all customers, leads, jobs, estimates, invoices, documents, and users under its slug. |
| **Default tenant** | `enix-exteriors` — seeded in migration `0001`. Single-tenant deployments contain only this row. |
| **Tenant context** | The `tenant_id` value derived from the authenticated user's JWT claim. Set once per request by `tenantContext` middleware. |
| **Tenant scope** | The subset of database rows where `tenant_id = <current tenant>`. Every business query is scoped this way. |

## Database contract

Every business-data table has a `tenant_id uuid REFERENCES tenants(id)`
column. Currently nullable (added in migration `0001`); becomes
`NOT NULL` in migration `0002` after the backfill is verified in
staging.

Tables with `tenant_id`:

- `users` (the company's employees + portal customers)
- `customers`
- `leads`
- `jobs`
- `estimates`
- `invoices`
- `payments`
- `smart_documents`

Tables explicitly **without** `tenant_id` (intentional):

- `tenants` — the registry itself
- `sessions` — joined via `user_id` → `users.tenant_id`
- `activity_log` — joined via `actor_id` → `users.tenant_id`
- `document_templates` — globally shared OR per-tenant via metadata; future
  decision

## Application contract

1. **Tenant context middleware** runs after `requireAuth` and before any
   data-route handler:

   ```ts
   app.use("/api", requireAuth);
   app.use("/api", tenantContext);
   app.use("/api/customers", customersRouter);
   ```

   It reads `req.user.tenant_id` (from the JWT) and sets
   `req.tenantId`. It also executes `SET LOCAL app.current_tenant_id = $1`
   on the connection, which is what Postgres RLS reads.

2. **Every query** in every route filters by `tenant_id = req.tenantId` —
   no exceptions. Even queries that look "scoped by foreign key" (e.g.
   estimates joined to a customer) MUST also filter by tenant_id, because
   RLS is best treated as a backstop, not the primary defense.

3. **Cross-tenant access returns 404** — never 403. A 403 confirms the
   resource exists; 404 doesn't. The integration test
   `tests/integration/tenant-isolation.test.ts` asserts this contract.

4. **Tenant-scoped uniqueness.** `users.email` is globally unique today,
   but after migration `0002` becomes unique **per tenant** so two
   tenants can legitimately share the same customer email.

## PostgreSQL Row-Level Security

RLS is the defense-in-depth backstop. Even if the application forgets to
filter, RLS prevents the row from being returned. Enabled in migration
`0002`:

```sql
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON customers
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
-- Repeat for leads, jobs, estimates, invoices, payments, smart_documents.

-- Application role cannot bypass RLS.
REVOKE BYPASSRLS ON DATABASE enix_prime_flow FROM enix_app;
```

The application sets `app.current_tenant_id` on each pooled connection
checkout:

```ts
db.transaction(async (tx) => {
  await tx.execute(sql`SET LOCAL app.current_tenant_id = ${req.tenantId}::uuid`);
  // ...all subsequent queries on tx are now RLS-scoped
});
```

## JWT contract

Access tokens carry the tenant claim:

```json
{
  "sub": "user-uuid",
  "email": "jane@example.com",
  "role": "admin",
  "tenant_id": "tenant-uuid",
  "type": "access",
  "iat": ...,
  "exp": ...
}
```

`tenant_id` is signed into the token by the server at login time, and
read back on every request by `tenantContext`. **Never** trust a
`tenant_id` from a request body, header, or query parameter.

## Migration plan: single → multi-tenant

| Step | Migration | Effect |
| --- | --- | --- |
| 1 | `0001_security_hardening.sql` (✅ done) | Add `tenants` table, nullable `tenant_id` on every business table, backfill to default tenant. |
| 2 | Backfill verification job | Run in staging: assert `SELECT count(*) FROM <table> WHERE tenant_id IS NULL = 0` for every table. |
| 3 | `0002_tenant_strict.sql` | `tenant_id NOT NULL`, drop global email uniqueness, add `unique(tenant_id, email)` indexes, enable RLS policies, revoke BYPASSRLS. |
| 4 | App code | Inject `tenantContext` middleware globally on `/api`. Add `tenant_id` claim to JWT. Add `tenant_id` filter to every Drizzle query. |
| 5 | Tenant provisioning UI | Superadmin-only `/api/tenants` endpoints (create, suspend, list). |
| 6 | Public tenant signup | Self-service tenant onboarding flow. Stripe Connect for per-tenant billing. |

## Negative tests (the audit checklist)

The following tests MUST pass before multi-tenant goes live:

- [ ] Tenant A authenticated → `GET /customers/<tenant-B-id>` → **404**
- [ ] Tenant A authenticated → `PATCH /customers/<tenant-B-id>` → **404**
- [ ] Tenant A authenticated → `GET /leads` → returns only tenant-A leads
- [ ] Tenant A authenticated → `GET /estimates` → returns only tenant-A
- [ ] Tenant A authenticated → `GET /invoices` → returns only tenant-A
- [ ] Tenant A authenticated → `GET /jobs` → returns only tenant-A
- [ ] Tenant A authenticated → `GET /smartdocs` → returns only tenant-A
- [ ] Raw SQL `SELECT * FROM customers` (without `app.current_tenant_id` set) → returns **zero rows** (RLS blocks everything)
- [ ] Two tenants can register users with the same email address
- [ ] Two tenants can have customers with the same email

## Operations contract

- **Backups** are tenant-scoped or full-DB-scoped only; never half-restores
  that could leave foreign keys dangling across tenants.
- **Logs** include `tenant_id` in the structured log line where available.
- **Metrics** are tagged by `tenant_id`.
- **Email-from addresses** are per-tenant where the tenant has verified an
  email domain; default-tenant uses `noreply@enixexteriors.com`.
