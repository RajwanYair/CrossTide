-- CrossTide D1 Database Schema
-- P3: Initial schema for user data persistence.
--
-- Tables:
--   watchlists     — user watchlist configurations
--   portfolios     — portfolio holdings and transactions
--   alert_rules    — price/indicator alert definitions
--   user_settings  — per-user preferences (theme, locale, layout)
--   sync_log       — CRDT sync state for cross-device sync

-- ─── Watchlists ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS watchlists (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id    TEXT NOT NULL,
  name       TEXT NOT NULL DEFAULT 'Default',
  tickers    TEXT NOT NULL DEFAULT '[]',  -- JSON array of ticker strings
  sort_col   TEXT DEFAULT 'ticker',
  sort_dir   TEXT DEFAULT 'asc',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_watchlists_user ON watchlists(user_id);

-- ─── Portfolios ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS portfolios (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id    TEXT NOT NULL,
  name       TEXT NOT NULL DEFAULT 'Main Portfolio',
  currency   TEXT NOT NULL DEFAULT 'USD',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_portfolios_user ON portfolios(user_id);

CREATE TABLE IF NOT EXISTS portfolio_holdings (
  id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  portfolio_id TEXT NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  ticker       TEXT NOT NULL,
  shares       REAL NOT NULL DEFAULT 0,
  avg_cost     REAL NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_holdings_portfolio ON portfolio_holdings(portfolio_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_holdings_unique ON portfolio_holdings(portfolio_id, ticker);

CREATE TABLE IF NOT EXISTS portfolio_transactions (
  id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  portfolio_id TEXT NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  ticker       TEXT NOT NULL,
  type         TEXT NOT NULL CHECK(type IN ('buy', 'sell', 'dividend')),
  shares       REAL NOT NULL,
  price        REAL NOT NULL,
  fees         REAL NOT NULL DEFAULT 0,
  date         TEXT NOT NULL,
  notes        TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_transactions_portfolio ON portfolio_transactions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON portfolio_transactions(portfolio_id, date);

-- ─── Alert Rules ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS alert_rules (
  id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id      TEXT NOT NULL,
  ticker       TEXT NOT NULL,
  condition    TEXT NOT NULL,  -- JSON: { field, operator, value }
  enabled      INTEGER NOT NULL DEFAULT 1,
  last_fired   TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_alerts_user ON alert_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_ticker ON alert_rules(ticker);

-- ─── User Settings ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_settings (
  user_id    TEXT PRIMARY KEY,
  settings   TEXT NOT NULL DEFAULT '{}',  -- JSON blob of all preferences
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Sync Log (CRDT) ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sync_log (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id    TEXT NOT NULL,
  entity     TEXT NOT NULL,  -- 'watchlist' | 'portfolio' | 'alert' | 'settings'
  entity_id  TEXT NOT NULL,
  operation  TEXT NOT NULL,  -- 'create' | 'update' | 'delete'
  payload    TEXT NOT NULL,  -- JSON delta
  timestamp  TEXT NOT NULL DEFAULT (datetime('now')),
  device_id  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sync_user_ts ON sync_log(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_sync_entity ON sync_log(user_id, entity, entity_id);
