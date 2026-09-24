-- Mercado Pago subscriptions are created by the Worker and only activated
-- after the Worker retrieves the authoritative status from Mercado Pago.
PRAGMA foreign_keys=OFF;

CREATE TABLE IF NOT EXISTS user_subscriptions_next (
  id TEXT PRIMARY KEY,
  uid TEXT NOT NULL,
  provider TEXT NOT NULL CHECK(provider IN ('google_play', 'mercado_pago', 'manual')),
  provider_subscription_id TEXT NOT NULL,
  plan_code TEXT NOT NULL REFERENCES subscription_plans(code),
  status TEXT NOT NULL CHECK(status IN ('trialing', 'active', 'grace_period', 'on_hold', 'canceled', 'expired', 'refunded')),
  current_period_start TEXT,
  current_period_end TEXT,
  cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
  trial_end TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, provider_subscription_id)
);

INSERT OR IGNORE INTO user_subscriptions_next(
  id, uid, provider, provider_subscription_id, plan_code, status,
  current_period_start, current_period_end, cancel_at_period_end, trial_end,
  created_at, updated_at
)
SELECT id, uid, provider, provider_subscription_id, plan_code, status,
  current_period_start, current_period_end, cancel_at_period_end, trial_end,
  created_at, updated_at
FROM user_subscriptions;

DROP TABLE user_subscriptions;
ALTER TABLE user_subscriptions_next RENAME TO user_subscriptions;
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_entitlements
  ON user_subscriptions(uid, status, current_period_end);

CREATE TABLE IF NOT EXISTS mercado_pago_checkout_sessions (
  id TEXT PRIMARY KEY,
  uid TEXT NOT NULL,
  payer_email TEXT NOT NULL,
  preapproval_id TEXT UNIQUE,
  checkout_url TEXT,
  status TEXT NOT NULL DEFAULT 'created',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mercado_pago_checkout_sessions_preapproval
  ON mercado_pago_checkout_sessions(preapproval_id);

PRAGMA foreign_keys=ON;
