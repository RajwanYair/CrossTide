/**
 * Ticker pinning — pin important tickers to always appear at the top
 * of the watchlist regardless of sort order.
 *
 * Pinned tickers are stored in localStorage and maintain their own order.
 */

const STORAGE_KEY = "crosstide-pinned-tickers";

let cache: string[] | null = null;

function load(): string[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        cache = parsed.filter((t): t is string => typeof t === "string");
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
 * Pin a ticker. Adds to the end of the pin list if not already pinned.
 */
export function pinTicker(ticker: string): void {
  const key = ticker.toUpperCase();
  const list = load();
  if (!list.includes(key)) {
    list.push(key);
    persist();
  }
}

/**
 * Unpin a ticker.
 */
export function unpinTicker(ticker: string): void {
  const key = ticker.toUpperCase();
  const list = load();
  const idx = list.indexOf(key);
  if (idx !== -1) {
    list.splice(idx, 1);
    persist();
  }
}

/**
 * Toggle pin state. Returns true if now pinned.
 */
export function togglePin(ticker: string): boolean {
  const key = ticker.toUpperCase();
  if (isPinned(key)) {
    unpinTicker(key);
    return false;
  }
  pinTicker(key);
  return true;
}

/**
 * Check if a ticker is pinned.
 */
export function isPinned(ticker: string): boolean {
  return load().includes(ticker.toUpperCase());
}

/**
 * Get all pinned tickers in order.
 */
export function getPinnedTickers(): readonly string[] {
  return load();
}

/**
 * Sort a list of tickers with pinned ones first (preserving pin order),
 * followed by unpinned tickers in their original order.
 */
export function sortWithPinnedFirst<T>(items: readonly T[], getTicker: (item: T) => string): T[] {
  const pinned = load();
  const pinnedSet = new Set(pinned);
  const pinnedItems: T[] = [];
  const unpinnedItems: T[] = [];

  // Collect pinned items in pin order
  for (const pin of pinned) {
    const item = items.find((i) => getTicker(i).toUpperCase() === pin);
    if (item) pinnedItems.push(item);
  }

  // Collect unpinned items in original order
  for (const item of items) {
    if (!pinnedSet.has(getTicker(item).toUpperCase())) {
      unpinnedItems.push(item);
    }
  }

  return [...pinnedItems, ...unpinnedItems];
}

/**
 * Clear all pins.
 */
export function clearPins(): void {
  cache = [];
  localStorage.removeItem(STORAGE_KEY);
}
