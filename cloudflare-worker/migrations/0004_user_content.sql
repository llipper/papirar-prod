CREATE TABLE IF NOT EXISTS user_content (
  id TEXT PRIMARY KEY,
  uid TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('highlight','annotation')),
  law_id TEXT NOT NULL,
  law_version_id TEXT NOT NULL,
  node_key TEXT NOT NULL,
  selected_text TEXT NOT NULL,
  start_offset INTEGER NOT NULL,
  end_offset INTEGER NOT NULL,
  color TEXT,
  note TEXT,
  archived_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_user_content_lookup ON user_content(uid, law_id, law_version_id, type);
