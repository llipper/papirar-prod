CREATE TABLE IF NOT EXISTS user_profiles (
  uid TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  username TEXT NOT NULL,
  bio TEXT NOT NULL DEFAULT '',
  avatar_path TEXT,
  avatar_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_reading_progress (
  uid TEXT NOT NULL,
  law_id TEXT NOT NULL,
  law_title TEXT NOT NULL,
  law_acronym TEXT NOT NULL,
  last_offset REAL NOT NULL DEFAULT 0,
  total_seconds INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(uid, law_id)
);

ALTER TABLE user_content ADD COLUMN block_index INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_content ADD COLUMN part_index INTEGER NOT NULL DEFAULT 0;
