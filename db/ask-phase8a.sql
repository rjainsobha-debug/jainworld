CREATE TABLE IF NOT EXISTS ask_queries (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  normalized_question TEXT,
  answer_mode TEXT,
  answer_summary TEXT,
  source_count INTEGER DEFAULT 0,
  confidence TEXT,
  safety_level TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ask_feedback (
  id TEXT PRIMARY KEY,
  ask_query_id TEXT,
  question TEXT,
  feedback TEXT,
  notes TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ask_review_queue (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  reason TEXT,
  safety_level TEXT,
  review_status TEXT DEFAULT 'pending_review',
  created_at TEXT NOT NULL,
  reviewed_at TEXT,
  reviewed_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_ask_queries_created_at ON ask_queries(created_at);
CREATE INDEX IF NOT EXISTS idx_ask_queries_normalized_question ON ask_queries(normalized_question);
CREATE INDEX IF NOT EXISTS idx_ask_feedback_ask_query_id ON ask_feedback(ask_query_id);
CREATE INDEX IF NOT EXISTS idx_ask_review_queue_review_status ON ask_review_queue(review_status);
