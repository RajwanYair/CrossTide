/**
 * KV caching layer with market-hours-aware TTL.
 *
 * P2: Implements intelligent cache TTLs based on market state.
 *
 * TTL strategy:
 *  - During market hours (Mon-Fri 9:30-16:00 ET): short TTLs (15-60s for quotes, 5m for charts)
 *  - After hours / weekends: longer TTLs (chart data won't change)
 *  - Historical ranges (1y+): very long TTLs (data is immutable)
 */

import type { KVNamespace } from "./index.js";

/** Read from KV with JSON deserialization. Returns null on miss or parse error. */
export async function kvGet<T>(kv: KVNamespace, key: string): Promise<T | null> {
  try {
    const raw = await kv.get(key, "text");
    if (raw == null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Write to KV with JSON serialization and TTL (in seconds). */
export async function kvPut<T>(
  kv: KVNamespace,
  key: string,
  value: T,
  ttlSeconds: number,
): Promise<void> {
  await kv.put(key, JSON.stringify(value), { expirationTtl: Math.max(60, ttlSeconds) });
}

/**
 * Compute TTL for chart data based on range and current market state.
 * Returns TTL in seconds.
 */
export function chartTtl(range: string): number {
  const marketOpen = isMarketOpen();

  // Historical data (>= 1 year): immutable — cache for 24h
  if (range === "1y" || range === "2y" || range === "5y" || range === "max") {
    return marketOpen ? 3600 : 86400; // 1h during market, 24h after
  }

  // Medium ranges (1mo-6mo): cache 15-60 min
  if (range === "1mo" || range === "3mo" || range === "6mo") {
    return marketOpen ? 900 : 3600; // 15m during market, 1h after
  }

  // Intraday (1d, 5d): short cache
  if (range === "5d") {
    return marketOpen ? 300 : 3600; // 5m during market, 1h after
  }

  // 1d range: very short during market hours
  return marketOpen ? 60 : 3600; // 1m during market, 1h after
}

/**
 * Compute TTL for quote data based on market state.
 * Returns TTL in seconds.
 */
export function quoteTtl(marketState: string): number {
  switch (marketState) {
    case "REGULAR":
      return 15; // 15 seconds during regular hours
    case "PRE":
    case "POST":
      return 60; // 1 minute during extended hours
    default:
      return 300; // 5 minutes when market closed
  }
}

/**
 * Heuristic check: is the US stock market likely open right now?
 * Uses UTC offset for Eastern Time (ET = UTC-5, EDT = UTC-4).
 */
function isMarketOpen(): boolean {
  const now = new Date();
  const utcDay = now.getUTCDay();

  // Weekend
  if (utcDay === 0 || utcDay === 6) return false;

  // Convert to approximate Eastern Time (UTC-4 for EDT, UTC-5 for EST)
  // Use UTC-4 (EDT) for a conservative estimate (market closes "earlier" in UTC)
  const etHour = (now.getUTCHours() - 4 + 24) % 24;
  const etMinute = now.getUTCMinutes();
  const etTime = etHour * 60 + etMinute;

  // Market hours: 9:30 AM - 4:00 PM ET
  const marketOpen = 9 * 60 + 30; // 9:30
  const marketClose = 16 * 60; // 16:00

  return etTime >= marketOpen && etTime < marketClose;
}
