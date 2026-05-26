-- Phase 9 ask quality migration.
-- SQLite/D1 does not support ADD COLUMN IF NOT EXISTS, so repeated runs may fail once the columns exist.
-- Apply after checking the current schema or keep these as one-time migration statements.

ALTER TABLE ask_queries ADD COLUMN detected_intent TEXT;
ALTER TABLE ask_queries ADD COLUMN quality_score INTEGER;
ALTER TABLE ask_queries ADD COLUMN quality_label TEXT;

-- source_ids may already exist from Phase 8B in some deployments.
-- Uncomment only if your deployed D1 schema does not yet contain source_ids.
-- ALTER TABLE ask_queries ADD COLUMN source_ids TEXT;
