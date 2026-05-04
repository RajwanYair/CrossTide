/**
 * Watchlist change history — tracks when tickers are added/removed from
 * the watchlist with timestamps for audit trail and undo support.
 */

export interface WatchlistChange {
  readonly ticker: string;
  readonly action: "add" | "remove";
  readonly timestamp: number;
}

const STORAGE_KEY = "crosstide-watchlist-history";
const MAX_ENTRIES = 200;

let cache: WatchlistChange[] | null = null;

function load(): WatchlistChange[] {
  if (cache !== null) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as WatchlistChange[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function save(entries: WatchlistChange[]): void {
  cache = entries;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

/**
 * Record a ticker addition to watchlist.
 */
export function recordAdd(ticker: string): void {
  const entries = load();
  entries.push({ ticker: ticker.toUpperCase(), action: "add", timestamp: Date.now() });
  if (entries.length > MAX_ENTRIES) entries.splice(0, entries.length - MAX_ENTRIES);
  save(entries);
}

/**
 * Record a ticker removal from watchlist.
 */
export function recordRemove(ticker: string): void {
  const entries = load();
  entries.push({ ticker: ticker.toUpperCase(), action: "remove", timestamp: Date.now() });
  if (entries.length > MAX_ENTRIES) entries.splice(0, entries.length - MAX_ENTRIES);
  save(entries);
}

/**
 * Get full change history (newest last).
 */
export function getWatchlistHistory(): readonly WatchlistChange[] {
  return load();
}

/**
 * Get recent N changes.
 */
export function getRecentChanges(count: number): readonly WatchlistChange[] {
  const entries = load();
  return entries.slice(-count);
}

/**
 * Get history filtered by ticker.
 */
export function getTickerHistory(ticker: string): readonly WatchlistChange[] {
  return load().filter((e) => e.ticker === ticker.toUpperCase());
}

/**
 * Get tickers that were removed but never re-added (candidates for undo).
 */
export function getRemovedTickers(): string[] {
  const entries = load();
  const state = new Map<string, "add" | "remove">();
  for (const entry of entries) {
    state.set(entry.ticker, entry.action);
  }
  const removed: string[] = [];
  for (const [ticker, action] of state) {
    if (action === "remove") removed.push(ticker);
  }
  return removed;
}

/**
 * Clear all history.
 */
export function clearWatchlistHistory(): void {
  cache = [];
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get max entries limit.
 */
export function getMaxEntries(): number {
  return MAX_ENTRIES;
}
