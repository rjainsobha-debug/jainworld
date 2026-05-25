CREATE TABLE IF NOT EXISTS search_queries (
  id TEXT PRIMARY KEY,
  query TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'all',
  result_count INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'pages-search',
  created_at TEXT NOT NULL,
  user_agent_hash TEXT,
  ip_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_search_queries_query ON search_queries(query);
CREATE INDEX IF NOT EXISTS idx_search_queries_created_at ON search_queries(created_at);
CREATE INDEX IF NOT EXISTS idx_search_queries_type ON search_queries(type);
