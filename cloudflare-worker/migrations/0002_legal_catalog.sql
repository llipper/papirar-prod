CREATE TABLE IF NOT EXISTS laws (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  acronym TEXT,
  published INTEGER NOT NULL DEFAULT 1,
  payload_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS law_versions (
  id TEXT PRIMARY KEY,
  law_id TEXT NOT NULL,
  version_label TEXT NOT NULL,
  scope_key TEXT NOT NULL,
  status TEXT NOT NULL,
  payload_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_law_versions_lookup ON law_versions(law_id, version_label, scope_key, status);
CREATE TABLE IF NOT EXISTS legal_nodes (
  id TEXT PRIMARY KEY,
  law_id TEXT NOT NULL,
  node_key TEXT NOT NULL,
  node_type TEXT NOT NULL,
  number TEXT,
  label TEXT,
  published INTEGER NOT NULL DEFAULT 1,
  payload_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_legal_nodes_law ON legal_nodes(law_id, published);
CREATE TABLE IF NOT EXISTS legal_node_versions (
  id TEXT PRIMARY KEY,
  law_version_id TEXT NOT NULL,
  node_key TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  revoked_at TEXT,
  payload_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_node_versions_lookup ON legal_node_versions(law_version_id, node_key, published, revoked_at, sort_order);
CREATE TABLE IF NOT EXISTS lei_audio_assets (
  id TEXT PRIMARY KEY,
  law_id TEXT NOT NULL,
  law_version_id TEXT,
  node_key TEXT,
  status TEXT NOT NULL,
  public_url TEXT,
  payload_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audio_lookup ON lei_audio_assets(law_id, law_version_id, status);
CREATE TABLE IF NOT EXISTS legal_annexes (
  id TEXT PRIMARY KEY,
  law_version_id TEXT NOT NULL,
  annex_key TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  payload_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS legal_annex_rows (
  id TEXT PRIMARY KEY,
  annex_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  payload_json TEXT NOT NULL
);
