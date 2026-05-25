CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS community_submissions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  mobile TEXT,
  city TEXT,
  country TEXT,
  join_as TEXT,
  preferred_language TEXT,
  contribution_interest TEXT,
  whatsapp_consent INTEGER NOT NULL DEFAULT 0,
  privacy_consent INTEGER NOT NULL DEFAULT 0,
  review_status TEXT NOT NULL DEFAULT 'pending_review',
  risk_notes TEXT,
  created_at TEXT NOT NULL,
  reviewed_at TEXT,
  reviewed_by TEXT
);

CREATE TABLE IF NOT EXISTS correction_submissions (
  id TEXT PRIMARY KEY,
  correction_type TEXT NOT NULL,
  related_slug TEXT,
  related_page TEXT,
  title TEXT,
  description TEXT NOT NULL,
  source_url TEXT,
  submitted_by_name TEXT,
  submitted_by_email TEXT,
  review_status TEXT NOT NULL DEFAULT 'pending_review',
  created_at TEXT NOT NULL,
  reviewed_at TEXT,
  reviewed_by TEXT
);

CREATE TABLE IF NOT EXISTS news_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  summary TEXT,
  source_name TEXT,
  source_url TEXT,
  canonical_url TEXT,
  content_hash TEXT,
  duplicate_group_id TEXT,
  category TEXT,
  region TEXT,
  relevance_score REAL DEFAULT 0,
  review_status TEXT NOT NULL DEFAULT 'pending_review',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL,
  published_at TEXT,
  reviewed_at TEXT,
  reviewed_by TEXT
);

CREATE TABLE IF NOT EXISTS resources (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  category TEXT,
  summary TEXT,
  eligibility TEXT,
  benefit TEXT,
  documents_required TEXT,
  state TEXT,
  official_url TEXT,
  source_name TEXT,
  last_verified_at TEXT,
  review_status TEXT NOT NULL DEFAULT 'pending_review',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL,
  reviewed_at TEXT,
  reviewed_by TEXT
);

CREATE TABLE IF NOT EXISTS audio_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  category TEXT,
  speaker TEXT,
  singer TEXT,
  tradition TEXT,
  language TEXT,
  duration TEXT,
  audio_url TEXT,
  embed_url TEXT,
  source TEXT,
  permission_status TEXT,
  verified_status TEXT,
  review_status TEXT NOT NULL DEFAULT 'pending_review',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL,
  reviewed_at TEXT,
  reviewed_by TEXT
);

CREATE TABLE IF NOT EXISTS temple_corrections (
  id TEXT PRIMARY KEY,
  temple_slug TEXT NOT NULL,
  correction_category TEXT NOT NULL,
  current_value TEXT,
  suggested_value TEXT,
  source_url TEXT,
  submitted_by_name TEXT,
  submitted_by_email TEXT,
  review_status TEXT NOT NULL DEFAULT 'pending_review',
  priority TEXT DEFAULT 'medium',
  created_at TEXT NOT NULL,
  reviewed_at TEXT,
  reviewed_by TEXT
);

CREATE TABLE IF NOT EXISTS image_assets (
  id TEXT PRIMARY KEY,
  related_type TEXT NOT NULL,
  related_slug TEXT,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  caption TEXT,
  source TEXT,
  license_status TEXT,
  review_status TEXT NOT NULL DEFAULT 'pending_review',
  created_at TEXT NOT NULL,
  reviewed_at TEXT,
  reviewed_by TEXT
);

CREATE TABLE IF NOT EXISTS review_logs (
  id TEXT PRIMARY KEY,
  item_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  action TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT,
  admin_email TEXT,
  notes TEXT,
  created_at TEXT NOT NULL
);

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

CREATE INDEX IF NOT EXISTS idx_community_submissions_review_status ON community_submissions(review_status);
CREATE INDEX IF NOT EXISTS idx_community_submissions_created_at ON community_submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_correction_submissions_review_status ON correction_submissions(review_status);
CREATE INDEX IF NOT EXISTS idx_correction_submissions_created_at ON correction_submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_news_items_slug ON news_items(slug);
CREATE INDEX IF NOT EXISTS idx_news_items_category ON news_items(category);
CREATE INDEX IF NOT EXISTS idx_news_items_review_status ON news_items(review_status);
CREATE INDEX IF NOT EXISTS idx_news_items_created_at ON news_items(created_at);
CREATE INDEX IF NOT EXISTS idx_news_items_duplicate_group_id ON news_items(duplicate_group_id);
CREATE INDEX IF NOT EXISTS idx_resources_slug ON resources(slug);
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_review_status ON resources(review_status);
CREATE INDEX IF NOT EXISTS idx_resources_created_at ON resources(created_at);
CREATE INDEX IF NOT EXISTS idx_audio_items_slug ON audio_items(slug);
CREATE INDEX IF NOT EXISTS idx_audio_items_category ON audio_items(category);
CREATE INDEX IF NOT EXISTS idx_audio_items_review_status ON audio_items(review_status);
CREATE INDEX IF NOT EXISTS idx_audio_items_created_at ON audio_items(created_at);
CREATE INDEX IF NOT EXISTS idx_temple_corrections_review_status ON temple_corrections(review_status);
CREATE INDEX IF NOT EXISTS idx_temple_corrections_created_at ON temple_corrections(created_at);
CREATE INDEX IF NOT EXISTS idx_image_assets_review_status ON image_assets(review_status);
CREATE INDEX IF NOT EXISTS idx_image_assets_created_at ON image_assets(created_at);
CREATE INDEX IF NOT EXISTS idx_review_logs_created_at ON review_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_search_queries_query ON search_queries(query);
CREATE INDEX IF NOT EXISTS idx_search_queries_created_at ON search_queries(created_at);
CREATE INDEX IF NOT EXISTS idx_search_queries_type ON search_queries(type);
CREATE INDEX IF NOT EXISTS idx_search_index_content_type ON search_index(content_type);
CREATE INDEX IF NOT EXISTS idx_search_index_status ON search_index(status);
CREATE INDEX IF NOT EXISTS idx_search_index_review_status ON search_index(review_status);
CREATE INDEX IF NOT EXISTS idx_search_index_category ON search_index(category);
CREATE INDEX IF NOT EXISTS idx_search_index_title ON search_index(title);
CREATE INDEX IF NOT EXISTS idx_search_index_created_at ON search_index(created_at);
