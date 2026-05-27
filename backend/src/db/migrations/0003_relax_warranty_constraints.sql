-- =============================================================================
-- Migration 0003 — Relax warranty NOT NULL constraints
-- =============================================================================
-- Warranties can be drafted before a job is opened (e.g. for cross-job
-- manufacturer warranties, or quotes/templates). The original schema forced
-- job_id, start_date, and end_date to be NOT NULL which blocks every realistic
-- create-flow used in the CRM.
-- =============================================================================

ALTER TABLE warranties ALTER COLUMN job_id DROP NOT NULL;
ALTER TABLE warranties ALTER COLUMN start_date DROP NOT NULL;
ALTER TABLE warranties ALTER COLUMN end_date DROP NOT NULL;
