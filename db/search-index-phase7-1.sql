CREATE TABLE IF NOT EXISTS search_index (
  id TEXT PRIMARY KEY,
  content_type TEXT NOT NULL,
  source_id TEXT,
  title TEXT NOT NULL,
  summary TEXT,
  body TEXT,
  url TEXT,
  category TEXT,
  tags TEXT,
  language TEXT DEFAULT 'en',
  status TEXT DEFAULT 'published',
  review_status TEXT DEFAULT 'verified',
  source_name TEXT,
  published_at TEXT,
  updated_at TEXT,
  search_weight INTEGER DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_search_index_content_type ON search_index(content_type);
CREATE INDEX IF NOT EXISTS idx_search_index_status ON search_index(status);
CREATE INDEX IF NOT EXISTS idx_search_index_review_status ON search_index(review_status);
CREATE INDEX IF NOT EXISTS idx_search_index_category ON search_index(category);
CREATE INDEX IF NOT EXISTS idx_search_index_title ON search_index(title);
CREATE INDEX IF NOT EXISTS idx_search_index_created_at ON search_index(created_at);
