/**
 * Earnings Calendar domain — pure types and transforms (H18).
 *
 * This module provides the domain model for earnings events and a suite of
 * pure functions for filtering, sorting, and classifying earnings data.
 * No API calls, no rendering — easy to test and reuse across cards and workers.
 */

// ─────────────────────────── Types ──────────────────────────────────────────

export interface EarningsEntry {
  /** Ticker symbol (always uppercase) */
  ticker: string;
  /** Company display name */
  companyName: string;
  /** ISO 8601 date string YYYY-MM-DD */
  earningsDate: string;
  /** Consensus EPS estimate (can be negative) */
  epsEstimate: number;
  /** Prior-period actual EPS */
  priorEps: number;
  /** Actual EPS surprise % (positive = beat; negative = miss; 0 if not yet reported) */
  surprisePct: number;
  /** Whether earnings have already been reported */
  reported?: boolean;
  /** "BMO" (before market open) or "AMC" (after market close); undefined if unknown */
  timing?: "BMO" | "AMC";
}

/** Subset of EarningsEntry coming from an external API response before validation. */
export interface RawEarningsItem {
  symbol?: string;
  ticker?: string;
  name?: string;
  companyName?: string;
  date?: string;
  earningsDate?: string;
  epsEstimate?: number | null;
  epsActual?: number | null;
  epsPrior?: number | null;
  priorEps?: number | null;
  surprisePct?: number | null;
  reported?: boolean;
  timing?: string;
}

// ─────────────────────────── Parsing ─────────────────────────────────────────

/**
 * Parse raw API data into a validated list of `EarningsEntry` objects.
 * Silently drops any malformed items (missing ticker or date).
 */
export function parseEarningsResponse(raw: readonly RawEarningsItem[]): EarningsEntry[] {
  const entries: EarningsEntry[] = [];
  for (const item of raw) {
    const ticker = (item.symbol ?? item.ticker ?? "").trim().toUpperCase();
    const date = item.date ?? item.earningsDate ?? "";
    if (!ticker || !isValidIsoDate(date)) continue;

    const epsEstimate = item.epsEstimate ?? 0;
    const priorEps = item.priorEps ?? item.epsPrior ?? 0;
    const actual = item.epsActual ?? null;
    const surprisePct =
      item.surprisePct != null
        ? item.surprisePct
        : actual != null && epsEstimate !== 0
          ? ((actual - epsEstimate) / Math.abs(epsEstimate)) * 100
          : 0;

    const timing = item.timing === "BMO" || item.timing === "AMC" ? item.timing : undefined;

    entries.push({
      ticker,
      companyName: (item.companyName ?? item.name ?? ticker).trim(),
      earningsDate: date,
      epsEstimate,
      priorEps,
      surprisePct,
      reported: item.reported ?? false,
      ...(timing !== undefined ? { timing } : {}),
    });
  }
  return entries;
}

// ─────────────────────────── Transforms ──────────────────────────────────────

/**
 * Sort earnings entries by date ascending (earliest first).
 * Preserves stable order for same-date entries.
 */
export function sortByDate(entries: readonly EarningsEntry[]): EarningsEntry[] {
  return [...entries].sort((a, b) => a.earningsDate.localeCompare(b.earningsDate));
}

/**
 * Return entries with earningsDate within the next `days` calendar days from `now`.
 * Includes today (diffDays = 0) through `days` days ahead.
 *
 * @param days  Look-ahead window (default 7)
 * @param now   Reference date (default: today UTC)
 */
export function filterUpcoming(
  entries: readonly EarningsEntry[],
  days = 7,
  now = new Date(),
): EarningsEntry[] {
  const todayMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return entries.filter((e) => {
    const targetMs = new Date(e.earningsDate + "T00:00:00Z").getTime();
    const diffDays = (targetMs - todayMs) / 86_400_000;
    return diffDays >= 0 && diffDays <= days;
  });
}

/**
 * How many calendar days until this earnings event.
 * Returns 0 for today, negative for past events.
 *
 * @param now  Reference date (default: today UTC)
 */
export function getDaysUntilEarnings(entry: EarningsEntry, now = new Date()): number {
  const todayMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const targetMs = new Date(entry.earningsDate + "T00:00:00Z").getTime();
  return Math.round((targetMs - todayMs) / 86_400_000);
}

/**
 * Classify an earnings surprise as "beat", "miss", or "inline".
 * "inline" means |surprisePct| <= threshold (default 2%).
 */
export function classifySurprise(entry: EarningsEntry, threshold = 2): "beat" | "miss" | "inline" {
  if (!entry.reported) return "inline";
  if (entry.surprisePct > threshold) return "beat";
  if (entry.surprisePct < -threshold) return "miss";
  return "inline";
}

// ─────────────────────────── Helpers ─────────────────────────────────────────

/** Returns true for YYYY-MM-DD formatted strings with a plausible date. */
function isValidIsoDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !isNaN(d.getTime());
}
