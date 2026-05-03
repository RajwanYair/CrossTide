/**
 * Data freshness tracker — monitors when data was last fetched and warns on staleness.
 *
 * Provides a utility to track data age for each ticker and display visual indicators
 * (fresh / stale / expired) to help users understand data reliability.
 */

export type FreshnessLevel = "fresh" | "stale" | "expired";

export interface FreshnessStatus {
  readonly ticker: string;
  readonly lastFetchedAt: number; // Unix ms
  readonly ageMs: number;
  readonly level: FreshnessLevel;
  readonly label: string;
}

/** Thresholds in milliseconds. */
const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
const EXPIRED_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

/** In-memory store of last fetch timestamps per ticker. */
const fetchTimestamps = new Map<string, number>();

/** Record that data for a ticker was just fetched. */
export function markFetched(ticker: string, now = Date.now()): void {
  fetchTimestamps.set(ticker.toUpperCase(), now);
}

/** Get the freshness status for a specific ticker. */
export function getFreshness(ticker: string, now = Date.now()): FreshnessStatus {
  const key = ticker.toUpperCase();
  const lastFetchedAt = fetchTimestamps.get(key) ?? 0;

  if (lastFetchedAt === 0) {
    return { ticker: key, lastFetchedAt: 0, ageMs: Infinity, level: "expired", label: "No data" };
  }

  const ageMs = now - lastFetchedAt;
  let level: FreshnessLevel;
  let label: string;

  if (ageMs < STALE_THRESHOLD_MS) {
    level = "fresh";
    label = "Live";
  } else if (ageMs < EXPIRED_THRESHOLD_MS) {
    level = "stale";
    const mins = Math.floor(ageMs / 60_000);
    label = `${mins}m ago`;
  } else {
    level = "expired";
    const mins = Math.floor(ageMs / 60_000);
    label = mins >= 60 ? `${Math.floor(mins / 60)}h ago` : `${mins}m ago`;
  }

  return { ticker: key, lastFetchedAt, ageMs, level, label };
}

/** Get freshness for all tracked tickers. */
export function getAllFreshness(now = Date.now()): FreshnessStatus[] {
  return Array.from(fetchTimestamps.keys()).map((ticker) => getFreshness(ticker, now));
}

/** Clear all tracked timestamps (for testing or reset). */
export function resetFreshness(): void {
  fetchTimestamps.clear();
}

/**
 * Render a small freshness badge as an HTML string.
 */
export function renderFreshnessBadge(status: FreshnessStatus): string {
  const cssClass = `freshness-badge freshness-${status.level}`;
  return `<span class="${cssClass}" title="Data age: ${status.label}">${status.label}</span>`;
}
