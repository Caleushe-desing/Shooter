PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  rut TEXT NOT NULL,
  branch TEXT NOT NULL,
  logo_path TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  status TEXT NOT NULL,
  name TEXT NOT NULL,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  decided_at TEXT,
  UNIQUE (company_id, username)
);

CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS inspections (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  type_name TEXT NOT NULL,
  group_name TEXT,
  equipment_code TEXT,
  location TEXT,
  inspector_name TEXT,
  cargo TEXT,
  observations TEXT,
  verdict TEXT,
  supervisor_name TEXT,
  inspector_strokes TEXT,
  supervisor_strokes TEXT,
  inspector_sig_path TEXT,
  supervisor_sig_path TEXT,
  share_token TEXT UNIQUE,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_insp_company ON inspections(company_id, created_at DESC);

CREATE TABLE IF NOT EXISTS inspection_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inspection_id TEXT NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  item_id TEXT,
  text TEXT NOT NULL,
  result TEXT,
  note TEXT
);

CREATE TABLE IF NOT EXISTS inspection_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inspection_id TEXT NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  path TEXT NOT NULL
);
