CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  day TEXT NOT NULL,
  type TEXT NOT NULL,
  path TEXT NOT NULL,
  title TEXT,
  referrer TEXT,
  visitor_id TEXT,
  session_id TEXT,
  ip_hash TEXT NOT NULL,
  ip_masked TEXT NOT NULL,
  ip_full TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  user_agent TEXT,
  device TEXT,
  is_owner INTEGER NOT NULL DEFAULT 0,
  detail TEXT
);

CREATE INDEX IF NOT EXISTS idx_events_day ON events(day);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_path ON events(path);
CREATE INDEX IF NOT EXISTS idx_events_visitor ON events(visitor_id);
