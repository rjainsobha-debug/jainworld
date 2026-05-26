-- Phase 8B incremental migration for Ask JainWorld.
-- Run this once against an existing D1 database after Phase 8A is already applied.
-- SQLite/D1 does not support ADD COLUMN IF NOT EXISTS, so repeated runs may fail once columns exist.

ALTER TABLE ask_queries ADD COLUMN source_ids TEXT;
ALTER TABLE ask_queries ADD COLUMN provider_used TEXT;
ALTER TABLE ask_queries ADD COLUMN model_used TEXT;

ALTER TABLE ask_feedback ADD COLUMN answer_mode TEXT;
ALTER TABLE ask_feedback ADD COLUMN source_helpful INTEGER DEFAULT 0;
ALTER TABLE ask_feedback ADD COLUMN feedback_category TEXT;
