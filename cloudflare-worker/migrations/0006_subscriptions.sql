-- A assinatura nunca é decidida pelo cliente. Estas tabelas são atualizadas
-- exclusivamente pelo Worker após confirmação do provedor de pagamento.
CREATE TABLE IF NOT EXISTS subscription_plans (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  billing_interval TEXT NOT NULL CHECK(billing_interval IN ('month', 'year')),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO subscription_plans(code, name, price_cents, currency, billing_interval)
VALUES ('premium_monthly', 'Papirar Premium Mensal', 2499, 'BRL', 'month');

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id TEXT PRIMARY KEY,
  uid TEXT NOT NULL,
  provider TEXT NOT NULL CHECK(provider IN ('google_play', 'manual')),
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

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_entitlements
  ON user_subscriptions(uid, status, current_period_end);

CREATE TABLE IF NOT EXISTS billing_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  event_key TEXT NOT NULL,
  uid TEXT,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, event_key)
);

CREATE TABLE IF NOT EXISTS usage_counters (
  uid TEXT NOT NULL,
  counter_code TEXT NOT NULL,
  period_key TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(uid, counter_code, period_key)
);
