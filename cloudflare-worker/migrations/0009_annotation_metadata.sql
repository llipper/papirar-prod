ALTER TABLE user_content ADD COLUMN annotation_color TEXT;
ALTER TABLE user_content ADD COLUMN annotation_type TEXT NOT NULL DEFAULT 'general';
ALTER TABLE user_content ADD COLUMN tags_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE user_content ADD COLUMN reminder_at TEXT;

CREATE INDEX IF NOT EXISTS idx_user_content_reminders
  ON user_content(uid, reminder_at)
  WHERE reminder_at IS NOT NULL AND archived_at IS NULL;
