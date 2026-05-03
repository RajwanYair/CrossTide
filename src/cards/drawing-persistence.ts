/**
 * Chart drawing persistence — saves/loads drawings per ticker via localStorage.
 *
 * Each ticker stores its drawing array as JSON under a namespaced key.
 * Max 50 tickers stored; LRU eviction removes the oldest entry when exceeded.
 */
import type { Drawing } from "./drawing-tools";

const STORAGE_PREFIX = "crosstide-drawings-";
const INDEX_KEY = "crosstide-drawings-index";
const MAX_TICKERS = 50;

/** Get the ordered list of ticker keys (most recently saved last). */
function loadIndex(): string[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function saveIndex(index: string[]): void {
  localStorage.setItem(INDEX_KEY, JSON.stringify(index));
}

/** Save drawings for a specific ticker. */
export function saveDrawings(ticker: string, drawings: readonly Drawing[]): void {
  if (!ticker) return;

  const key = STORAGE_PREFIX + ticker.toUpperCase();

  if (drawings.length === 0) {
    localStorage.removeItem(key);
    const index = loadIndex().filter((t) => t !== ticker.toUpperCase());
    saveIndex(index);
    return;
  }

  // LRU eviction
  const index = loadIndex().filter((t) => t !== ticker.toUpperCase());
  while (index.length >= MAX_TICKERS) {
    const evicted = index.shift();
    if (evicted) localStorage.removeItem(STORAGE_PREFIX + evicted);
  }
  index.push(ticker.toUpperCase());
  saveIndex(index);

  localStorage.setItem(key, JSON.stringify(drawings));
}

/** Load saved drawings for a specific ticker. Returns empty array if none found. */
export function loadDrawings(ticker: string): Drawing[] {
  if (!ticker) return [];
  const key = STORAGE_PREFIX + ticker.toUpperCase();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    // Basic validation: each item must have a "kind" string
    return parsed.filter(
      (d): d is Drawing =>
        typeof d === "object" &&
        d !== null &&
        typeof (d as Record<string, unknown>).kind === "string",
    );
  } catch {
    return [];
  }
}

/** Remove all saved drawings (all tickers). */
export function clearAllSavedDrawings(): void {
  const index = loadIndex();
  for (const ticker of index) {
    localStorage.removeItem(STORAGE_PREFIX + ticker);
  }
  localStorage.removeItem(INDEX_KEY);
}
