-- =============================================================================
-- 0005_invoices_quickbooks_link.sql
-- -----------------------------------------------------------------------------
-- Adds QuickBooks Online sync metadata to invoices so the admin UI can show
-- sync state and re-sync after edits. All columns are nullable so existing
-- rows remain valid.
-- =============================================================================

ALTER TABLE invoices
    ADD COLUMN IF NOT EXISTS quickbooks_id          varchar(64),
    ADD COLUMN IF NOT EXISTS quickbooks_doc_number  varchar(64),
    ADD COLUMN IF NOT EXISTS quickbooks_synced_at   timestamptz,
    ADD COLUMN IF NOT EXISTS quickbooks_sync_error  text;

CREATE UNIQUE INDEX IF NOT EXISTS invoices_quickbooks_id_uq
    ON invoices (quickbooks_id)
    WHERE quickbooks_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS invoices_quickbooks_synced_idx
    ON invoices (quickbooks_synced_at);
