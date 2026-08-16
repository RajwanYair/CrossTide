/**
 * Alert History API Route — GET /api/alerts/history
 *
 * Queries fired alert history from D1. Supports filtering by user, ticker,
 * and date range via query parameters.
 *
 * Query params:
 *   user_id  — required, filters by user
 *   ticker   — optional, filters by ticker symbol
 *   since    — optional, ISO 8601 lower bound for fired_at
 *   limit    — optional, max results (default 50, max 200)
 *
 * Also implements S04's remaining data-retention gap: a scheduled purge of
 * rows past the documented 180-day retention window (see
 * `docs/DATA_RETENTION.md`), and self-service export/delete endpoints so a
 * user's `alert_history` no longer requires an operator running a manual
 * `wrangler d1 execute` query.
 */

import type { D1Database, D1PreparedStatement } from "../index.js";

/** Documented retention window — see docs/DATA_RETENTION.md. */
export const ALERT_HISTORY_RETENTION_DAYS = 180;

/** Hard cap on export size — same abuse-control posture as the 200-row query cap. */
const EXPORT_ROW_CAP = 10_000;

export interface AlertHistoryRow {
  id: string;
  rule_id: string;
  user_id: string;
  ticker: string;
  condition: string;
  value: number;
  fired_at: string;
}

export interface AlertHistoryResponse {
  history: AlertHistoryRow[];
  count: number;
}

/**
 * Insert a fired alert into the history table.
 */
export async function insertAlertHistory(
  db: D1Database,
  entry: {
    ruleId: string;
    userId: string;
    ticker: string;
    condition: string;
    value: number;
    firedAt: string;
  },
): Promise<void> {
  await db
    .prepare(
      "INSERT INTO alert_history (rule_id, user_id, ticker, condition, value, fired_at) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(entry.ruleId, entry.userId, entry.ticker, entry.condition, entry.value, entry.firedAt)
    .run();
}

/**
 * Query alert history with optional filters.
 */
export async function queryAlertHistory(
  db: D1Database,
  params: {
    userId: string;
    ticker?: string;
    since?: string;
    limit?: number;
  },
): Promise<AlertHistoryResponse> {
  const limit = Math.min(Math.max(params.limit ?? 50, 1), 200);
  const conditions: string[] = ["user_id = ?"];
  const bindings: unknown[] = [params.userId];

  if (params.ticker) {
    conditions.push("ticker = ?");
    bindings.push(params.ticker.toUpperCase());
  }

  if (params.since) {
    conditions.push("fired_at >= ?");
    bindings.push(params.since);
  }

  const where = conditions.join(" AND ");
  const sql = `SELECT id, rule_id, user_id, ticker, condition, value, fired_at FROM alert_history WHERE ${where} ORDER BY fired_at DESC LIMIT ?`;
  bindings.push(limit);

  const stmt: D1PreparedStatement = db.prepare(sql).bind(...bindings);
  const result = await stmt.all<AlertHistoryRow>();

  return {
    history: result.results,
    count: result.results.length,
  };
}

/**
 * Export the full alert history for a user, up to `EXPORT_ROW_CAP` rows.
 * Unlike `queryAlertHistory` this has no default 50/200 pagination cap —
 * it is meant for a one-shot self-service data export, not a UI list view.
 */
export async function exportAlertHistoryForUser(
  db: D1Database,
  userId: string,
): Promise<AlertHistoryRow[]> {
  const stmt: D1PreparedStatement = db
    .prepare(
      "SELECT id, rule_id, user_id, ticker, condition, value, fired_at FROM alert_history WHERE user_id = ? ORDER BY fired_at DESC LIMIT ?",
    )
    .bind(userId, EXPORT_ROW_CAP);
  const result = await stmt.all<AlertHistoryRow>();
  return result.results;
}

/**
 * Delete every `alert_history` row for a user — the self-service equivalent
 * of the operator-run `DELETE FROM alert_history WHERE user_id = ?` query
 * documented in docs/DATA_RETENTION.md.
 */
export async function deleteAlertHistoryForUser(db: D1Database, userId: string): Promise<number> {
  const result = await db.prepare("DELETE FROM alert_history WHERE user_id = ?").bind(userId).run();
  return typeof result.meta.changes === "number" ? result.meta.changes : 0;
}

/**
 * Delete every `alert_history` row older than the retention window.
 * Called from the Worker's `scheduled()` handler on a daily cron — see
 * `worker/index.ts` and `worker/wrangler.toml`'s `[triggers]` section.
 */
export async function purgeExpiredAlertHistory(
  db: D1Database,
  retentionDays: number = ALERT_HISTORY_RETENTION_DAYS,
): Promise<number> {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
  const result = await db
    .prepare("DELETE FROM alert_history WHERE fired_at < ?")
    .bind(cutoff)
    .run();
  return typeof result.meta.changes === "number" ? result.meta.changes : 0;
}

function toCsv(rows: readonly AlertHistoryRow[]): string {
  const header = "id,rule_id,user_id,ticker,condition,value,fired_at";
  const escape = (v: string): string => (/[",\n]/u.test(v) ? `"${v.replaceAll('"', '""')}"` : v);
  const lines = rows.map((r) =>
    [r.id, r.rule_id, r.user_id, r.ticker, escape(r.condition), r.value, r.fired_at].join(","),
  );
  return [header, ...lines].join("\n");
}

/**
 * HTTP handler for GET /api/alerts/history.
 */
export async function handleAlertHistory(url: URL, env: { DB?: D1Database }): Promise<Response> {
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Database not available" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = url.searchParams.get("user_id");
  if (!userId) {
    return new Response(JSON.stringify({ error: "user_id query parameter is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const ticker = url.searchParams.get("ticker") ?? undefined;
  const since = url.searchParams.get("since") ?? undefined;
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : undefined;

  const result = await queryAlertHistory(env.DB, { userId, ticker, since, limit });

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * HTTP handler for GET /api/alerts/history/export — self-service data export
 * (S04). Returns JSON by default, or CSV with `?format=csv`.
 */
export async function handleAlertHistoryExport(
  url: URL,
  env: { DB?: D1Database },
): Promise<Response> {
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Database not available" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = url.searchParams.get("user_id");
  if (!userId) {
    return new Response(JSON.stringify({ error: "user_id query parameter is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const rows = await exportAlertHistoryForUser(env.DB, userId);

  if (url.searchParams.get("format") === "csv") {
    return new Response(toCsv(rows), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="alert-history-${userId}.csv"`,
      },
    });
  }

  return new Response(JSON.stringify({ history: rows, count: rows.length }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * HTTP handler for DELETE /api/alerts/history — self-service deletion (S04).
 * Deletes all rows for the given `user_id`; there is no partial-delete mode.
 */
export async function handleAlertHistoryDelete(
  url: URL,
  env: { DB?: D1Database },
): Promise<Response> {
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "Database not available" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = url.searchParams.get("user_id");
  if (!userId) {
    return new Response(JSON.stringify({ error: "user_id query parameter is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const deleted = await deleteAlertHistoryForUser(env.DB, userId);

  return new Response(JSON.stringify({ deleted }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
