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
 */

import type { D1Database, D1PreparedStatement } from "../index.js";

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
