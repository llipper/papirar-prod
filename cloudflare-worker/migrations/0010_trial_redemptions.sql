CREATE TABLE IF NOT EXISTS trial_redemptions (
  uid TEXT PRIMARY KEY,
  redeemed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trial_redemptions_expiry
  ON trial_redemptions(expires_at);
