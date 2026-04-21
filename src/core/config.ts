/**
 * Configuration management — load/save/defaults.
 */
import type { AppConfig, WatchlistEntry } from "../types/domain";

const STORAGE_KEY = "crosstide-config";
const CONFIG_VERSION = 1;

interface StoredConfig {
  version: number;
  config: AppConfig;
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
    if (isStoredConfig(parsed) && parsed.version === CONFIG_VERSION) {
      return parsed.config;
    }
    return DEFAULT_CONFIG;
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

function isStoredConfig(val: unknown): val is StoredConfig {
  return (
    typeof val === "object" &&
    val !== null &&
    "version" in val &&
    "config" in val &&
    typeof (val as StoredConfig).version === "number"
  );
}
