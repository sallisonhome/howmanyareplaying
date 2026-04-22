CREATE TABLE IF NOT EXISTS page_views (
  id         SERIAL PRIMARY KEY,
  path       TEXT NOT NULL,
  referrer   TEXT,
  user_agent TEXT,
  ip_hash    TEXT,
  is_bot     BOOLEAN DEFAULT FALSE,
  country    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views (created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_path       ON page_views (path);
CREATE INDEX IF NOT EXISTS idx_page_views_is_bot     ON page_views (is_bot);
