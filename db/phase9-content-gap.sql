-- Phase 9 content gaps migration.
-- Run once against an existing D1 database after previous phases are applied.

CREATE TABLE IF NOT EXISTS content_gaps (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  normalized_question TEXT,
  detected_intent TEXT,
  missing_topic TEXT,
  source_count INTEGER DEFAULT 0,
  frequency_count INTEGER DEFAULT 1,
  last_asked_at TEXT,
  first_asked_at TEXT,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  admin_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_content_gaps_normalized_question ON content_gaps(normalized_question);
CREATE INDEX IF NOT EXISTS idx_content_gaps_status ON content_gaps(status);
CREATE INDEX IF NOT EXISTS idx_content_gaps_priority ON content_gaps(priority);
CREATE INDEX IF NOT EXISTS idx_content_gaps_last_asked_at ON content_gaps(last_asked_at);
