CREATE TABLE IF NOT EXISTS legal_change_notifications (
  id TEXT PRIMARY KEY,
  law_id TEXT NOT NULL,
  law_title TEXT NOT NULL,
  law_acronym TEXT NOT NULL DEFAULT '',
  law_version_id TEXT NOT NULL,
  change_type TEXT NOT NULL,
  node_key TEXT,
  node_label TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_legal_change_notifications_created
  ON legal_change_notifications(created_at DESC);

CREATE TABLE IF NOT EXISTS user_legal_notification_reads (
  uid TEXT NOT NULL,
  notification_id TEXT NOT NULL,
  read_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(uid, notification_id),
  FOREIGN KEY(notification_id) REFERENCES legal_change_notifications(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_legal_notification_reads_uid
  ON user_legal_notification_reads(uid, read_at DESC);
