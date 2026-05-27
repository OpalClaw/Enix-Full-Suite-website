-- =============================================================================
-- Migration 0002 — Full-suite buildout
-- =============================================================================
-- Brings the database in line with the schema additions required to power
-- every CRM surface: Tasks, Appointments, Messages (Twilio), Warranties,
-- Inspections (roofing/exterior, residential/commercial), Contracts (DocuSign),
-- expanded user roles, and the app_settings store that backs Settings.
--
-- All statements are idempotent (IF NOT EXISTS / DO blocks) and safe to re-run.
-- =============================================================================

-- ---- 1. Extend user_role enum -------------------------------------------------
-- ALTER TYPE ... ADD VALUE is transactional in PG 12+ but the value cannot be
-- consumed in the same transaction. Done in its own transaction.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'user_role'::regtype AND enumlabel = 'sales_rep') THEN
    EXECUTE 'ALTER TYPE user_role ADD VALUE ''sales_rep''';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'user_role'::regtype AND enumlabel = 'project_lead') THEN
    EXECUTE 'ALTER TYPE user_role ADD VALUE ''project_lead''';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'user_role'::regtype AND enumlabel = 'project_manager') THEN
    EXECUTE 'ALTER TYPE user_role ADD VALUE ''project_manager''';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'user_role'::regtype AND enumlabel = 'production_manager') THEN
    EXECUTE 'ALTER TYPE user_role ADD VALUE ''production_manager''';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'user_role'::regtype AND enumlabel = 'crew_lead') THEN
    EXECUTE 'ALTER TYPE user_role ADD VALUE ''crew_lead''';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'user_role'::regtype AND enumlabel = 'office_staff') THEN
    EXECUTE 'ALTER TYPE user_role ADD VALUE ''office_staff''';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'user_role'::regtype AND enumlabel = 'subcontractor') THEN
    EXECUTE 'ALTER TYPE user_role ADD VALUE ''subcontractor''';
  END IF;
END $$;

-- ---- 2. Users: HR fields ------------------------------------------------------
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS title              varchar(100),
  ADD COLUMN IF NOT EXISTS company            varchar(200),
  ADD COLUMN IF NOT EXISTS assigned_territory varchar(200),
  ADD COLUMN IF NOT EXISTS crew_id            uuid;

-- ---- 3. Tasks ----------------------------------------------------------------
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS lead_id        uuid REFERENCES leads(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_to    uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS task_type      varchar(50),
  ADD COLUMN IF NOT EXISTS completed_date timestamptz,
  ADD COLUMN IF NOT EXISTS notes          text,
  ADD COLUMN IF NOT EXISTS updated_at     timestamptz NOT NULL DEFAULT now();

ALTER TABLE tasks ALTER COLUMN status SET DEFAULT 'not_started';
ALTER TABLE tasks ALTER COLUMN priority SET DEFAULT 'medium';

-- Backfill legacy status values from the original schema (open/closed)
UPDATE tasks SET status = 'not_started' WHERE status = 'open';
UPDATE tasks SET status = 'completed'   WHERE status = 'closed';

CREATE INDEX IF NOT EXISTS tasks_status_idx   ON tasks(status);
CREATE INDEX IF NOT EXISTS tasks_assigned_idx ON tasks(assignee_id);

-- ---- 4. Appointments ----------------------------------------------------------
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS title          varchar(200),
  ADD COLUMN IF NOT EXISTS assigned_to    uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_crew  uuid,
  ADD COLUMN IF NOT EXISTS customer_name  varchar(200),
  ADD COLUMN IF NOT EXISTS customer_phone varchar(20),
  ADD COLUMN IF NOT EXISTS address        text,
  ADD COLUMN IF NOT EXISTS reminder_sent  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at     timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS appointments_scheduled_idx ON appointments(scheduled_at);

-- ---- 5. Messages: Twilio + threading ------------------------------------------
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS lead_id           uuid REFERENCES leads(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recipient_phone   varchar(20),
  ADD COLUMN IF NOT EXISTS recipient_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sender_name       varchar(200),
  ADD COLUMN IF NOT EXISTS channel           varchar(20)  NOT NULL DEFAULT 'in_app',
  ADD COLUMN IF NOT EXISTS direction         varchar(20)  NOT NULL DEFAULT 'outbound',
  ADD COLUMN IF NOT EXISTS content           text,
  ADD COLUMN IF NOT EXISTS is_internal       boolean      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS twilio_sid        varchar(64),
  ADD COLUMN IF NOT EXISTS twilio_status     varchar(50),
  ADD COLUMN IF NOT EXISTS metadata          jsonb DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS messages_job_idx     ON messages(job_id);
CREATE INDEX IF NOT EXISTS messages_created_idx ON messages(created_at);

-- ---- 6. Inspections: residential/commercial + roofing checklist ---------------
ALTER TABLE inspections
  ADD COLUMN IF NOT EXISTS lead_id                uuid REFERENCES leads(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS inspector_name         varchar(200),
  ADD COLUMN IF NOT EXISTS service_type           varchar(50),
  ADD COLUMN IF NOT EXISTS property_type          property_type NOT NULL DEFAULT 'residential',
  ADD COLUMN IF NOT EXISTS customer_name          varchar(200),
  ADD COLUMN IF NOT EXISTS property_address       text,
  ADD COLUMN IF NOT EXISTS inspection_date        timestamptz,
  ADD COLUMN IF NOT EXISTS roof_type              varchar(100),
  ADD COLUMN IF NOT EXISTS shingle_type           varchar(100),
  ADD COLUMN IF NOT EXISTS roof_age               varchar(50),
  ADD COLUMN IF NOT EXISTS squares                numeric(10, 2),
  ADD COLUMN IF NOT EXISTS pitch                  varchar(20),
  ADD COLUMN IF NOT EXISTS layers                 integer,
  ADD COLUMN IF NOT EXISTS damage_notes           text,
  ADD COLUMN IF NOT EXISTS leak_notes             text,
  ADD COLUMN IF NOT EXISTS ventilation_notes      text,
  ADD COLUMN IF NOT EXISTS flashing_notes         text,
  ADD COLUMN IF NOT EXISTS storm_damage_checklist jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS checklist              jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS insurance_claim_notes  text,
  ADD COLUMN IF NOT EXISTS recommended_scope      text,
  ADD COLUMN IF NOT EXISTS photo_urls             jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at             timestamptz NOT NULL DEFAULT now();

ALTER TABLE inspections ALTER COLUMN inspection_type SET DEFAULT 'roofing';
CREATE INDEX IF NOT EXISTS inspections_status_idx ON inspections(status);

-- ---- 7. Warranties: customer + claims -----------------------------------------
ALTER TABLE warranties
  ADD COLUMN IF NOT EXISTS customer_name    varchar(200),
  ADD COLUMN IF NOT EXISTS customer_email   varchar(255),
  ADD COLUMN IF NOT EXISTS property_address text,
  ADD COLUMN IF NOT EXISTS manufacturer     varchar(200),
  ADD COLUMN IF NOT EXISTS document_url     text,
  ADD COLUMN IF NOT EXISTS active           boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS claims           jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS notes            text,
  ADD COLUMN IF NOT EXISTS status           varchar(50),
  ADD COLUMN IF NOT EXISTS updated_at       timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'warranties' AND column_name = 'duration_years'
  ) THEN
    EXECUTE 'ALTER TABLE warranties ADD COLUMN duration_years integer GENERATED ALWAYS AS (coverage_years) STORED';
  END IF;
END
$$;

-- ---- 8. Contracts: builder + DocuSign ----------------------------------------
ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS contract_number          varchar(50),
  ADD COLUMN IF NOT EXISTS estimate_id              uuid REFERENCES estimates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS customer_id              uuid REFERENCES customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS customer_name            varchar(200),
  ADD COLUMN IF NOT EXISTS customer_email           varchar(255),
  ADD COLUMN IF NOT EXISTS customer_phone           varchar(20),
  ADD COLUMN IF NOT EXISTS property_address         text,
  ADD COLUMN IF NOT EXISTS template_id              uuid,
  ADD COLUMN IF NOT EXISTS title                    varchar(200),
  ADD COLUMN IF NOT EXISTS contract_price           numeric(14, 2),
  ADD COLUMN IF NOT EXISTS status                   varchar(50) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS signed                   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS signed_by_client_at      timestamptz,
  ADD COLUMN IF NOT EXISTS signed_by_business_at    timestamptz,
  ADD COLUMN IF NOT EXISTS body_content             jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS line_items               jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS docusign_envelope_id     varchar(100),
  ADD COLUMN IF NOT EXISTS docusign_status          varchar(50),
  ADD COLUMN IF NOT EXISTS docusign_last_event_at   timestamptz,
  ADD COLUMN IF NOT EXISTS created_by               uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at               timestamptz NOT NULL DEFAULT now();

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contracts_contract_number_key') THEN
    BEGIN
      ALTER TABLE contracts ADD CONSTRAINT contracts_contract_number_key UNIQUE (contract_number);
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS contracts_job_idx              ON contracts(job_id);
CREATE INDEX IF NOT EXISTS contracts_status_idx           ON contracts(status);
CREATE INDEX IF NOT EXISTS contracts_docusign_envelope_idx ON contracts(docusign_envelope_id);

-- ---- 9. Reviews: timestamp consistency ----------------------------------------
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- ---- 10. app_settings: integration credentials + company config ---------------
CREATE TABLE IF NOT EXISTS app_settings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key         varchar(100) NOT NULL UNIQUE,
  value       jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_secret   boolean NOT NULL DEFAULT false,
  description text,
  updated_by  uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS app_settings_key_idx ON app_settings(key);

-- Seed the integration keys so the Settings UI has a canonical set to render
INSERT INTO app_settings (key, value, is_secret, description) VALUES
  ('integration.twilio',     '{"account_sid":"","auth_token":"","from_number":"","status_callback_url":"","enabled":false}'::jsonb, true,  'Twilio SMS + voice credentials. Powers Messages.'),
  ('integration.docusign',   '{"integration_key":"","user_id":"","account_id":"","base_path":"https://demo.docusign.net/restapi","private_key":"","webhook_secret":"","enabled":false}'::jsonb, true,  'DocuSign envelope credentials. Powers Contracts e-signature.'),
  ('integration.eagleview',  '{"client_id":"","client_secret":"","api_base":"https://webservices.eagleview.com/","enabled":false}'::jsonb, true,  'EagleView roof measurements API.'),
  ('integration.quickbooks', '{"client_id":"","client_secret":"","realm_id":"","refresh_token":"","environment":"sandbox","enabled":false}'::jsonb, true, 'QuickBooks Online OAuth credentials. Powers Invoices.'),
  ('integration.abc_supply', '{"api_key":"","account_number":"","api_base":"https://api.abcsupply.com/v1/","enabled":false}'::jsonb, true,  'ABC Supply / ABC Roofing pricing + ordering API.'),
  ('integration.smtp',       '{"host":"","port":587,"secure":false,"user":"","password":"","from_address":"","from_name":"Enix Exteriors","enabled":false}'::jsonb, true, 'SMTP email transport for invites + notifications.'),
  ('company.profile',        '{"name":"Enix Exteriors","legal_name":"","address":"","city":"","state":"","zip":"","phone":"","email":"","website":"","tax_id":"","logo_url":"","brand_primary":"#0F2942","brand_accent":"#C8A85C"}'::jsonb, false, 'Public company profile and branding.'),
  ('notifications.preferences','{"new_lead_email":true,"new_lead_sms":false,"signed_contract_email":true,"payment_received_email":true,"crew_assignment_sms":true}'::jsonb, false, 'Notification preferences for office staff.'),
  ('roles.permissions',      '{}'::jsonb, false, 'Role -> permissions overrides.')
ON CONFLICT (key) DO NOTHING;
