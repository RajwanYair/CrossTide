/**
 * Quote staleness detector — identify tickers whose data may be outdated
 * based on last update timestamps and market hours.
 */

export interface StalenessCheck {
  readonly ticker: string;
  readonly lastUpdateAt: number;
  readonly ageMs: number;
  readonly status: "fresh" | "stale" | "expired";
}

export interface StalenessThresholds {
  readonly freshMs: number; // Under this = fresh
  readonly staleMs: number; // Under this = stale, over = expired
}

const DEFAULT_THRESHOLDS: StalenessThresholds = {
  freshMs: 5 * 60 * 1000, // 5 minutes
  staleMs: 30 * 60 * 1000, // 30 minutes
};

/**
 * Check staleness of a single ticker quote.
 */
export function checkStaleness(
  ticker: string,
  lastUpdateAt: number,
  now?: number,
  thresholds?: StalenessThresholds,
): StalenessCheck {
  const currentTime = now ?? Date.now();
  const t = thresholds ?? DEFAULT_THRESHOLDS;
  const ageMs = currentTime - lastUpdateAt;

  let status: "fresh" | "stale" | "expired";
  if (ageMs <= t.freshMs) {
    status = "fresh";
  } else if (ageMs <= t.staleMs) {
    status = "stale";
  } else {
    status = "expired";
  }

  return {
    ticker: ticker.toUpperCase(),
    lastUpdateAt,
    ageMs,
    status,
  };
}

/**
 * Check staleness for multiple tickers.
 */
export function checkMultipleStaleness(
  tickers: readonly { ticker: string; lastUpdateAt: number }[],
  now?: number,
  thresholds?: StalenessThresholds,
): StalenessCheck[] {
  const currentTime = now ?? Date.now();
  return tickers.map((t) => checkStaleness(t.ticker, t.lastUpdateAt, currentTime, thresholds));
}

/**
 * Get only stale or expired tickers.
 */
export function getStaleQuotes(checks: readonly StalenessCheck[]): StalenessCheck[] {
  return checks.filter((c) => c.status !== "fresh");
}

/**
 * Get only expired tickers.
 */
export function getExpiredQuotes(checks: readonly StalenessCheck[]): StalenessCheck[] {
  return checks.filter((c) => c.status === "expired");
}

/**
 * Get a summary breakdown of staleness.
 */
export function stalenessSummary(checks: readonly StalenessCheck[]): {
  fresh: number;
  stale: number;
  expired: number;
} {
  let fresh = 0;
  let stale = 0;
  let expired = 0;
  for (const c of checks) {
    if (c.status === "fresh") fresh++;
    else if (c.status === "stale") stale++;
    else expired++;
  }
  return { fresh, stale, expired };
}

/**
 * Format age as human-readable string.
 */
export function formatAge(ageMs: number): string {
  const seconds = Math.floor(ageMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m ago`;
}

/**
 * Check if market is likely open (simple US market hours heuristic).
 * Mon-Fri 9:30-16:00 ET (approximate, no holiday awareness).
 */
export function isMarketHours(date?: Date): boolean {
  const d = date ?? new Date();
  const day = d.getUTCDay();
  if (day === 0 || day === 6) return false; // Weekend

  // Approximate ET as UTC-4 (EDT) or UTC-5 (EST)
  // Market: 13:30-20:00 UTC (EDT) or 14:30-21:00 UTC (EST)
  const hour = d.getUTCHours();
  const minute = d.getUTCMinutes();
  const timeInMinutes = hour * 60 + minute;
  // Use wider window: 13:30 - 21:00 UTC to cover both EDT and EST
  return timeInMinutes >= 810 && timeInMinutes <= 1260;
}
