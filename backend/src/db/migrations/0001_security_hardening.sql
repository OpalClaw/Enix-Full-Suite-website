-- =============================================================================
-- Migration 0001 — Security hardening
-- =============================================================================
-- Adds:
--   • Account lockout columns on users (failed counter, last failed timestamp,
--     locked_until timestamp).
--   • Session revocation_reason for audit trail.
--   • Tenant scaffold: tenants table + tenant_id column (NULLABLE for backward
--     compatibility; future migration 0002 will enforce NOT NULL after seeding).
--   • PostgreSQL Row-Level Security policy template (commented; enabled in 0002).
--   • Default Enix Exteriors tenant seed.
-- =============================================================================

BEGIN;

-- ---- 1. Account lockout columns ----
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS failed_login_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_failed_login_at  timestamptz,
  ADD COLUMN IF NOT EXISTS locked_until          timestamptz;

CREATE INDEX IF NOT EXISTS users_locked_until_idx ON users (locked_until)
  WHERE locked_until IS NOT NULL;

-- ---- 2. Session revocation audit ----
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS revocation_reason varchar(64);

-- ---- 3. Tenants scaffold (multi-tenant ready, single-tenant by default) ----
CREATE TABLE IF NOT EXISTS tenants (
  id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        varchar(50)  NOT NULL UNIQUE,
  name        varchar(200) NOT NULL,
  status      varchar(20)  NOT NULL DEFAULT 'active',
  metadata    jsonb        NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now()
);

INSERT INTO tenants (slug, name, metadata)
VALUES ('enix-exteriors', 'Enix Exteriors', '{"primary": true, "industry": "roofing"}'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- Helper: capture the default tenant id once for the backfill below.
DO $$
DECLARE
  default_tenant uuid;
BEGIN
  SELECT id INTO default_tenant FROM tenants WHERE slug = 'enix-exteriors' LIMIT 1;

  -- ---- 4. Add NULLABLE tenant_id to every tenant-scoped table ----
  -- Nullable on this migration; enforced NOT NULL after a successful backfill
  -- in migration 0002. This pattern is safe for production rolling deploys.

  ALTER TABLE users          ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
  ALTER TABLE customers      ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
  ALTER TABLE leads          ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
  ALTER TABLE jobs           ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
  ALTER TABLE estimates      ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
  ALTER TABLE invoices       ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
  ALTER TABLE payments       ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
  ALTER TABLE smart_documents ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);

  -- ---- 5. Backfill existing rows to the default tenant ----
  UPDATE users           SET tenant_id = default_tenant WHERE tenant_id IS NULL;
  UPDATE customers       SET tenant_id = default_tenant WHERE tenant_id IS NULL;
  UPDATE leads           SET tenant_id = default_tenant WHERE tenant_id IS NULL;
  UPDATE jobs            SET tenant_id = default_tenant WHERE tenant_id IS NULL;
  UPDATE estimates       SET tenant_id = default_tenant WHERE tenant_id IS NULL;
  UPDATE invoices        SET tenant_id = default_tenant WHERE tenant_id IS NULL;
  UPDATE payments        SET tenant_id = default_tenant WHERE tenant_id IS NULL;
  UPDATE smart_documents SET tenant_id = default_tenant WHERE tenant_id IS NULL;
END$$;

-- ---- 6. Indexes for tenant-scoped queries ----
CREATE INDEX IF NOT EXISTS users_tenant_idx          ON users          (tenant_id);
CREATE INDEX IF NOT EXISTS customers_tenant_idx      ON customers      (tenant_id);
CREATE INDEX IF NOT EXISTS leads_tenant_idx          ON leads          (tenant_id);
CREATE INDEX IF NOT EXISTS jobs_tenant_idx           ON jobs           (tenant_id);
CREATE INDEX IF NOT EXISTS estimates_tenant_idx      ON estimates      (tenant_id);
CREATE INDEX IF NOT EXISTS invoices_tenant_idx       ON invoices       (tenant_id);
CREATE INDEX IF NOT EXISTS payments_tenant_idx       ON payments       (tenant_id);
CREATE INDEX IF NOT EXISTS smart_documents_tenant_idx ON smart_documents (tenant_id);

-- ---- 7. Email uniqueness must become tenant-scoped (multi-tenant correctness) ----
-- Two tenants legitimately share the same customer email.
-- We keep the existing global UNIQUE on users.email until migration 0002,
-- which is the cut-over point. For now, document the intent:
--
--   -- DROP INDEX users_email_idx;
--   -- CREATE UNIQUE INDEX users_email_tenant_idx ON users (tenant_id, email);
--
-- Performing this in two steps avoids race conditions during deployment.

-- ---- 8. RLS template (DISABLED until migration 0002 enforces tenant_id NOT NULL) ----
-- The following statements will be UNCOMMENTED in migration 0002:
--
--   ALTER TABLE customers      ENABLE ROW LEVEL SECURITY;
--   ALTER TABLE leads          ENABLE ROW LEVEL SECURITY;
--   ALTER TABLE jobs           ENABLE ROW LEVEL SECURITY;
--   ALTER TABLE estimates      ENABLE ROW LEVEL SECURITY;
--   ALTER TABLE invoices       ENABLE ROW LEVEL SECURITY;
--   ALTER TABLE payments       ENABLE ROW LEVEL SECURITY;
--   ALTER TABLE smart_documents ENABLE ROW LEVEL SECURITY;
--
--   CREATE POLICY tenant_isolation ON customers
--     USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
--   (repeat for each table)
--
--   GRANT USAGE ON SCHEMA public TO enix_app;
--   REVOKE BYPASSRLS ON DATABASE enix_prime_flow FROM enix_app;
--
-- The application sets `app.current_tenant_id` per connection via
-- `SET LOCAL app.current_tenant_id = '<uuid>'` in tenantContext middleware.

COMMIT;
