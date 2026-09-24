CREATE TABLE IF NOT EXISTS ai_explanation_cache (
  cache_key TEXT PRIMARY KEY,
  law_version_id TEXT NOT NULL,
  node_key TEXT NOT NULL,
  text_hash TEXT NOT NULL,
  response_json TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_version INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS ai_daily_usage (
  uid TEXT NOT NULL,
  usage_day TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (uid, usage_day)
);
