/**
 * Recent tickers history — tracks recently viewed/selected tickers
 * for quick-access navigation.
 *
 * Stores the last N tickers viewed in localStorage as an ordered list
 * (most recent first). Duplicates are moved to the front.
 */

const STORAGE_KEY = "crosstide-recent-tickers";
const MAX_RECENT = 10;

let cache: string[] | null = null;

function load(): string[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        cache = parsed.filter((t): t is string => typeof t === "string").slice(0, MAX_RECENT);
        return cache;
      }
    }
  } catch {
    // ignore
  }
  cache = [];
  return cache;
}

function persist(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(load()));
}

/**
 * Record that a ticker was viewed/selected.
 * Moves it to the front of the list.
 */
export function recordTickerView(ticker: string): void {
  const key = ticker.toUpperCase();
  const list = load();
  const idx = list.indexOf(key);
  if (idx !== -1) {
    list.splice(idx, 1);
  }
  list.unshift(key);
  if (list.length > MAX_RECENT) {
    list.length = MAX_RECENT;
  }
  persist();
}

/**
 * Get the list of recently viewed tickers (most recent first).
 */
export function getRecentTickers(): readonly string[] {
  return load();
}

/**
 * Clear all recent ticker history.
 */
export function clearRecentTickers(): void {
  cache = [];
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get the maximum number of recent tickers stored.
 */
export function getMaxRecent(): number {
  return MAX_RECENT;
}
