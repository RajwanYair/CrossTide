/**
 * Alert Server-Side Evaluation — R7.
 *
 * Evaluates active alert rules against current market data using D1.
 * Designed to be invoked from a Cloudflare Cron Trigger (scheduled handler).
 *
 * Alert condition format (stored in D1 as JSON):
 *   { field: "price", operator: "above" | "below" | "crosses", value: number }
 *   { field: "changePercent", operator: "above" | "below", value: number }
 *
 * When an alert fires:
 *   - `last_fired` is updated to current timestamp
 *   - `enabled` is set to 0 (one-shot by default)
 *   - The fired alert is returned for downstream notification dispatch
 */

import type { D1Database } from "../index.js";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AlertCondition {
  field: "price" | "changePercent" | "volume";
  operator: "above" | "below" | "crosses";
  value: number;
}

export interface AlertRule {
  id: string;
  user_id: string;
  ticker: string;
  condition: AlertCondition;
  enabled: boolean;
  last_fired: string | null;
}

export interface FiredAlert {
  ruleId: string;
  userId: string;
  ticker: string;
  condition: AlertCondition;
  currentValue: number;
  firedAt: string;
}

export interface QuoteSnapshot {
  symbol: string;
  price: number;
  changePercent: number;
  volume: number;
}

// ── Evaluation logic ──────────────────────────────────────────────────────────

/**
 * Check if a single alert condition is met given a quote snapshot.
 */
export function evaluateCondition(condition: AlertCondition, quote: QuoteSnapshot): boolean {
  let fieldValue: number;
  switch (condition.field) {
    case "price":
      fieldValue = quote.price;
      break;
    case "changePercent":
      fieldValue = quote.changePercent;
      break;
    case "volume":
      fieldValue = quote.volume;
      break;
    default:
      return false;
  }

  switch (condition.operator) {
    case "above":
      return fieldValue > condition.value;
    case "below":
      return fieldValue < condition.value;
    case "crosses":
      // For "crosses" we check if current value is on the other side of threshold
      // This is a simplified check — full implementation would track previous value
      return (
        Math.abs(fieldValue - condition.value) / Math.max(1, Math.abs(condition.value)) < 0.005
      );
    default:
      return false;
  }
}

// ── D1 queries ────────────────────────────────────────────────────────────────

/**
 * Load all enabled alert rules from D1, grouped by ticker.
 */
export async function loadEnabledAlerts(db: D1Database): Promise<AlertRule[]> {
  const result = await db
    .prepare(
      "SELECT id, user_id, ticker, condition, enabled, last_fired FROM alert_rules WHERE enabled = 1",
    )
    .all<{
      id: string;
      user_id: string;
      ticker: string;
      condition: string;
      enabled: number;
      last_fired: string | null;
    }>();

  return result.results.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    ticker: row.ticker,
    condition: JSON.parse(row.condition) as AlertCondition,
    enabled: row.enabled === 1,
    last_fired: row.last_fired,
  }));
}

/**
 * Mark an alert as fired: set last_fired and disable it (one-shot).
 */
export async function markAlertFired(
  db: D1Database,
  ruleId: string,
  firedAt: string,
): Promise<void> {
  await db
    .prepare("UPDATE alert_rules SET last_fired = ?, enabled = 0, updated_at = ? WHERE id = ?")
    .bind(firedAt, firedAt, ruleId)
    .run();
}

// ── Batch evaluation ──────────────────────────────────────────────────────────

/**
 * Evaluate all enabled alerts against a set of quote snapshots.
 * Returns the list of fired alerts. Marks each as fired in D1.
 */
export async function evaluateAlerts(
  db: D1Database,
  quotes: ReadonlyMap<string, QuoteSnapshot>,
): Promise<FiredAlert[]> {
  const rules = await loadEnabledAlerts(db);
  const fired: FiredAlert[] = [];
  const now = new Date().toISOString();

  for (const rule of rules) {
    const quote = quotes.get(rule.ticker.toUpperCase());
    if (!quote) continue;

    if (evaluateCondition(rule.condition, quote)) {
      const fieldValue =
        rule.condition.field === "price"
          ? quote.price
          : rule.condition.field === "changePercent"
            ? quote.changePercent
            : quote.volume;

      fired.push({
        ruleId: rule.id,
        userId: rule.user_id,
        ticker: rule.ticker,
        condition: rule.condition,
        currentValue: fieldValue,
        firedAt: now,
      });

      await markAlertFired(db, rule.id, now);
    }
  }

  return fired;
}

// ── Scheduled handler ─────────────────────────────────────────────────────────

export interface AlertEvalEnv {
  DB?: D1Database;
  QUOTE_CACHE?: { get(key: string, type: "json"): Promise<unknown> };
}

/**
 * Entry point for Cloudflare Cron Trigger.
 * Loads quotes from KV cache, evaluates all enabled alerts, fires matches.
 *
 * Designed to run every 1-5 minutes during market hours.
 */
export async function handleScheduledAlertEval(env: AlertEvalEnv): Promise<FiredAlert[]> {
  if (!env.DB) return [];

  const rules = await loadEnabledAlerts(env.DB);
  if (rules.length === 0) return [];

  // Collect unique tickers
  const tickers = [...new Set(rules.map((r) => r.ticker.toUpperCase()))];

  // Fetch current quotes from KV cache (pre-populated by quote route)
  const quotes = new Map<string, QuoteSnapshot>();
  if (env.QUOTE_CACHE) {
    for (const ticker of tickers) {
      const cached = (await env.QUOTE_CACHE.get(`quote:${ticker}`, "json")) as QuoteSnapshot | null;
      if (cached) quotes.set(ticker, cached);
    }
  }

  if (quotes.size === 0) return [];

  return evaluateAlerts(env.DB, quotes);
}
