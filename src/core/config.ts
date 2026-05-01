/**
 * Configuration management — load/save/defaults.
 */
import type { AppConfig, WatchlistEntry } from "../types/domain";
import { AppConfigSchema, safeParse } from "../types/valibot-schemas";

const STORAGE_KEY = "crosstide-config";
const CONFIG_VERSION = 1;

interface StoredConfig {
  version: number;
  config: unknown;
}

const DEFAULT_CONFIG: AppConfig = {
  theme: "dark",
  watchlist: [],
};

export function loadConfig(): AppConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed: unknown = JSON.parse(raw);
    if (!isStoredEnvelope(parsed) || parsed.version !== CONFIG_VERSION) {
      return DEFAULT_CONFIG;
    }
    const result = safeParse(AppConfigSchema, parsed.config);
    if (!result.success) return DEFAULT_CONFIG;

    // G19: WatchlistEntrySchema intentionally omits `name` to avoid type conflicts
    // with exactOptionalPropertyTypes. Re-attach persisted names from the raw JSON.
    const cfg = result.output;
    const rawCfg = parsed.config as Record<string, unknown>;
    const rawWatchlist = Array.isArray(rawCfg["watchlist"]) ? rawCfg["watchlist"] : [];
    const watchlist = cfg.watchlist.map((entry, idx) => {
      const rawEntry = rawWatchlist[idx] as Record<string, unknown> | undefined;
      const name = typeof rawEntry?.["name"] === "string" ? rawEntry["name"] : undefined;
      return name ? { ...entry, name } : entry;
    });
    return watchlist === cfg.watchlist ? cfg : { ...cfg, watchlist };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config: AppConfig): void {
  const stored: StoredConfig = { version: CONFIG_VERSION, config };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

export function addTicker(config: AppConfig, ticker: string): AppConfig {
  const normalized = ticker.toUpperCase().trim();
  if (!normalized || config.watchlist.some((w) => w.ticker === normalized)) {
    return config;
  }
  const entry: WatchlistEntry = {
    ticker: normalized,
    addedAt: new Date().toISOString(),
  };
  return { ...config, watchlist: [...config.watchlist, entry] };
}

export function removeTicker(config: AppConfig, ticker: string): AppConfig {
  return {
    ...config,
    watchlist: config.watchlist.filter((w) => w.ticker !== ticker),
  };
}

/**
 * Merge company names returned by the data service into the watchlist entries.
 * Only updates entries that have a `name` in the provided map and don't already
 * have that exact name stored — avoids a no-op save cycle.
 * Returns the same `config` object reference if nothing changed.
 */
export function updateWatchlistNames(
  config: AppConfig,
  names: ReadonlyMap<string, string>,
): AppConfig {
  let changed = false;
  const next = config.watchlist.map((entry) => {
    const name = names.get(entry.ticker);
    if (!name || entry.name === name) return entry;
    changed = true;
    return { ...entry, name };
  });
  return changed ? { ...config, watchlist: next } : config;
}

/** Move a watchlist entry from one index to another (for drag-reorder). */
export function reorderWatchlist(config: AppConfig, from: number, to: number): AppConfig {
  if (from < 0 || from >= config.watchlist.length) return config;
  const next = [...config.watchlist];
  const [item] = next.splice(from, 1);
  const insertAt = Math.max(0, Math.min(to, next.length));
  next.splice(insertAt, 0, item!);
  return { ...config, watchlist: next };
}

function isStoredEnvelope(val: unknown): val is StoredConfig {
  return (
    typeof val === "object" &&
    val !== null &&
    "version" in val &&
    "config" in val &&
    typeof (val as StoredConfig).version === "number"
  );
}
