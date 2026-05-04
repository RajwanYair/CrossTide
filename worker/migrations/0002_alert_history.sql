-- Alert History table — stores a log of all fired alerts for querying.
-- Completes R7 by providing server-side history persistence.

CREATE TABLE IF NOT EXISTS alert_history (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  rule_id    TEXT NOT NULL,
  user_id    TEXT NOT NULL,
  ticker     TEXT NOT NULL,
  condition  TEXT NOT NULL,  -- JSON: { field, operator, value }
  value      REAL NOT NULL,  -- the actual value that triggered the alert
  fired_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_alert_history_user ON alert_history(user_id, fired_at);
CREATE INDEX IF NOT EXISTS idx_alert_history_ticker ON alert_history(ticker, fired_at);
