/**
 * Search history suggestions — track past ticker searches and provide
 * autocomplete suggestions based on frequency and recency.
 */

const STORAGE_KEY = "crosstide-search-history";
const MAX_ENTRIES = 100;

export interface SearchEntry {
  readonly query: string;
  readonly count: number;
  readonly lastUsedAt: number;
}

let cache: Map<string, SearchEntry> | null = null;

function load(): Map<string, SearchEntry> {
  if (cache !== null) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const entries = JSON.parse(raw) as SearchEntry[];
      cache = new Map(entries.map((e) => [e.query, e]));
    } else {
      cache = new Map();
    }
  } catch {
    cache = new Map();
  }
  return cache;
}

function save(): void {
  const map = load();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...map.values()]));
}

/**
 * Record a search query.
 */
export function recordSearch(query: string): void {
  const key = query.trim().toUpperCase();
  if (!key) return;
  const map = load();
  const existing = map.get(key);
  map.set(key, {
    query: key,
    count: (existing?.count ?? 0) + 1,
    lastUsedAt: Date.now(),
  });

  // Evict oldest if over limit
  if (map.size > MAX_ENTRIES) {
    let oldest: string | null = null;
    let oldestTime = Infinity;
    for (const [k, v] of map) {
      if (v.lastUsedAt < oldestTime) {
        oldestTime = v.lastUsedAt;
        oldest = k;
      }
    }
    if (oldest) map.delete(oldest);
  }

  save();
}

/**
 * Get suggestions matching a prefix, sorted by frequency then recency.
 */
export function getSuggestions(prefix: string, limit = 10): readonly SearchEntry[] {
  const p = prefix.trim().toUpperCase();
  if (!p) return getRecentSearches(limit);
  const map = load();
  const matches: SearchEntry[] = [];
  for (const entry of map.values()) {
    if (entry.query.startsWith(p)) {
      matches.push(entry);
    }
  }
  matches.sort((a, b) => b.count - a.count || b.lastUsedAt - a.lastUsedAt);
  return matches.slice(0, limit);
}

/**
 * Get most recent searches.
 */
export function getRecentSearches(limit = 10): readonly SearchEntry[] {
  const map = load();
  return [...map.values()].sort((a, b) => b.lastUsedAt - a.lastUsedAt).slice(0, limit);
}

/**
 * Get most frequently searched queries.
 */
export function getFrequentSearches(limit = 10): readonly SearchEntry[] {
  const map = load();
  return [...map.values()]
    .sort((a, b) => b.count - a.count || b.lastUsedAt - a.lastUsedAt)
    .slice(0, limit);
}

/**
 * Remove a specific entry from history.
 */
export function removeFromHistory(query: string): boolean {
  const map = load();
  const deleted = map.delete(query.trim().toUpperCase());
  if (deleted) save();
  return deleted;
}

/**
 * Clear all search history.
 */
export function clearSearchHistory(): void {
  cache = new Map();
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get total number of entries.
 */
export function getHistorySize(): number {
  return load().size;
}
