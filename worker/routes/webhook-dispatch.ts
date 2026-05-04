/**
 * Webhook notification dispatch for fired alerts.
 *
 * When alerts fire via the scheduled evaluator, this module dispatches
 * notifications to user-configured webhook endpoints (Slack, Discord,
 * generic HTTP POST).
 *
 * Webhook URLs are stored per-user in D1 `user_settings.notifications_webhook`.
 */

import type { D1Database } from "../index.js";
import type { FiredAlert } from "./alert-eval.js";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WebhookTarget {
  userId: string;
  url: string;
}

export interface WebhookPayload {
  event: "alert.fired";
  alerts: WebhookAlertPayload[];
  timestamp: string;
}

export interface WebhookAlertPayload {
  ruleId: string;
  ticker: string;
  condition: { field: string; operator: string; value: number };
  currentValue: number;
  firedAt: string;
}

export interface WebhookResult {
  userId: string;
  url: string;
  status: number | "error";
  error?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Load webhook URLs for a set of user IDs from D1.
 * Returns one URL per user (from user_settings.notifications_webhook).
 */
export async function loadWebhookTargets(
  db: D1Database,
  userIds: string[],
): Promise<WebhookTarget[]> {
  if (userIds.length === 0) return [];

  // Build parameterized query — one placeholder per user ID
  const placeholders = userIds.map(() => "?").join(", ");
  const sql = `SELECT user_id, json_extract(value, '$.notifications_webhook') AS webhook_url
    FROM user_settings
    WHERE user_id IN (${placeholders})
    AND json_extract(value, '$.notifications_webhook') IS NOT NULL
    AND json_extract(value, '$.notifications_webhook') != ''`;

  const result = await db
    .prepare(sql)
    .bind(...userIds)
    .all<{ user_id: string; webhook_url: string }>();

  return result.results.map((row) => ({
    userId: row.user_id,
    url: row.webhook_url,
  }));
}

/**
 * Format fired alerts into a webhook payload grouped by user.
 */
export function buildWebhookPayload(alerts: FiredAlert[]): WebhookPayload {
  return {
    event: "alert.fired",
    alerts: alerts.map((a) => ({
      ruleId: a.ruleId,
      ticker: a.ticker,
      condition: a.condition,
      currentValue: a.currentValue,
      firedAt: a.firedAt,
    })),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Send a webhook POST request with timeout.
 * Returns the HTTP status or "error" on failure.
 */
export async function sendWebhook(
  url: string,
  payload: WebhookPayload,
): Promise<WebhookResult["status"]> {
  try {
    // Validate URL before sending (prevent SSRF to internal networks)
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return "error";
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "CrossTide-Alerts/1.0",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    return response.status;
  } catch {
    return "error";
  }
}

// ── Main dispatcher ───────────────────────────────────────────────────────────

/**
 * Dispatch webhook notifications for all fired alerts.
 * Groups alerts by user, loads their webhook URL, then sends.
 */
export async function dispatchWebhooks(
  db: D1Database,
  firedAlerts: FiredAlert[],
): Promise<WebhookResult[]> {
  if (firedAlerts.length === 0) return [];

  // Group by user
  const byUser = new Map<string, FiredAlert[]>();
  for (const alert of firedAlerts) {
    const existing = byUser.get(alert.userId);
    if (existing) {
      existing.push(alert);
    } else {
      byUser.set(alert.userId, [alert]);
    }
  }

  // Load webhook targets
  const targets = await loadWebhookTargets(db, [...byUser.keys()]);
  if (targets.length === 0) return [];

  // Send webhooks in parallel (bounded concurrency)
  const results: WebhookResult[] = [];
  const MAX_CONCURRENT = 5;
  const queue = [...targets];

  while (queue.length > 0) {
    const batch = queue.splice(0, MAX_CONCURRENT);
    const batchResults = await Promise.all(
      batch.map(async (target) => {
        const userAlerts = byUser.get(target.userId) ?? [];
        const payload = buildWebhookPayload(userAlerts);
        const status = await sendWebhook(target.url, payload);
        return { userId: target.userId, url: target.url, status } satisfies WebhookResult;
      }),
    );
    results.push(...batchResults);
  }

  return results;
}
