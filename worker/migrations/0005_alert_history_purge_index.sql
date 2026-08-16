-- S04: index the alert_history retention purge path.
-- The existing (user_id, fired_at) and (ticker, fired_at) composite indexes
-- do not help a bare `WHERE fired_at < ?` scan (fired_at is not the leading
-- column in either), which is exactly the query the daily purge cron runs.

CREATE INDEX IF NOT EXISTS idx_alert_history_fired_at ON alert_history(fired_at);
