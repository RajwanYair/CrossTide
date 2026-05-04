/**
 * Watchlist color tags — assign color labels to tickers for visual categorization.
 *
 * Tags are stored in localStorage and can be: bullish (green), bearish (red),
 * neutral (gray), watch (blue), or custom colors.
 */

const STORAGE_KEY = "crosstide-ticker-tags";

export type TagColor = "green" | "red" | "gray" | "blue" | "orange" | "purple";

export interface TickerTag {
  readonly color: TagColor;
  readonly label: string;
}

export const TAG_PRESETS: readonly { color: TagColor; label: string }[] = [
  { color: "green", label: "Bullish" },
  { color: "red", label: "Bearish" },
  { color: "gray", label: "Neutral" },
  { color: "blue", label: "Watch" },
  { color: "orange", label: "Earnings" },
  { color: "purple", label: "Speculative" },
];

let cache: Map<string, TickerTag> | null = null;

function load(): Map<string, TickerTag> {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, TickerTag>;
      cache = new Map(Object.entries(parsed));
    } else {
      cache = new Map();
    }
  } catch {
    cache = new Map();
  }
  return cache;
}

function persist(): void {
  const map = load();
  const obj: Record<string, TickerTag> = {};
  for (const [k, v] of map) {
    obj[k] = v;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
}

export function getTickerTag(ticker: string): TickerTag | undefined {
  return load().get(ticker.toUpperCase());
}

export function setTickerTag(ticker: string, tag: TickerTag): void {
  const key = ticker.toUpperCase();
  load().set(key, tag);
  persist();
}

export function removeTickerTag(ticker: string): void {
  const key = ticker.toUpperCase();
  const map = load();
  map.delete(key);
  persist();
}

export function getAllTickerTags(): ReadonlyMap<string, TickerTag> {
  return load();
}

export function hasTickerTag(ticker: string): boolean {
  return load().has(ticker.toUpperCase());
}

/**
 * Get the CSS color variable value for a given tag color.
 */
export function tagColorToCss(color: TagColor): string {
  const map: Record<TagColor, string> = {
    green: "var(--tag-green, #22c55e)",
    red: "var(--tag-red, #ef4444)",
    gray: "var(--tag-gray, #6b7280)",
    blue: "var(--tag-blue, #3b82f6)",
    orange: "var(--tag-orange, #f97316)",
    purple: "var(--tag-purple, #a855f7)",
  };
  return map[color];
}
