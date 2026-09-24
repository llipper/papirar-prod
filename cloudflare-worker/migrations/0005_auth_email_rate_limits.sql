CREATE TABLE IF NOT EXISTS auth_email_rate_limits (
  rate_key TEXT PRIMARY KEY,
  sent_at INTEGER NOT NULL
);
