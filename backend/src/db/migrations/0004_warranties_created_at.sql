-- =============================================================================
-- Migration 0004 — Warranties: add created_at
-- =============================================================================
-- The original warranties table never had a created_at column. The schema
-- declares one and the CRUD route orders by it. Add it now and backfill from
-- updated_at so existing rows have a sane value.
-- =============================================================================

ALTER TABLE warranties
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

UPDATE warranties SET created_at = updated_at WHERE created_at >= updated_at;

CREATE INDEX IF NOT EXISTS warranties_created_at_idx ON warranties(created_at DESC);
