/**
 * Configuration management — load/save/defaults.
 */
import type {
  AppConfig,
  CardId,
  CardSettingsMap,
  InstrumentType,
  MethodWeights,
  WatchlistEntry,
} from "../types/domain";
import {
  AlertsCardSettingsSchema,
  AppConfigSchema,
  BacktestCardSettingsSchema,
  ChartCardSettingsSchema,
  ConsensusCardSettingsSchema,
  HeatmapCardSettingsSchema,
  PortfolioCardSettingsSchema,
  RiskCardSettingsSchema,
  ScreenerCardSettingsSchema,
  WatchlistCardSettingsSchema,
  safeParse,
} from "../types/valibot-schemas";

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

const CARD_IDS: readonly CardId[] = [
  "watchlist",
  "chart",
  "consensus",
  "screener",
  "heatmap",
  "backtest",
  "alerts",
  "portfolio",
  "risk",
] as const;

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

    // G20: AppConfigSchema omits `methodWeights` for the same reason. Parse manually
    // to keep exactOptionalPropertyTypes clean.
    const rawWeights = rawCfg["methodWeights"];
    const methodWeights: MethodWeights | undefined = parseMethodWeights(rawWeights);
    const cardSettings: CardSettingsMap | undefined = parseCardSettings(rawCfg["cardSettings"]);

    const baseConfig = watchlist === cfg.watchlist ? cfg : { ...cfg, watchlist };
    const withWeights = methodWeights !== undefined ? { ...baseConfig, methodWeights } : baseConfig;
    return cardSettings !== undefined ? { ...withWeights, cardSettings } : withWeights;
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

/**
 * Persist instrument type classifications from fetched data into watchlist entries.
 * Only updates entries whose type is currently undefined or has changed.
 * Returns the same config reference if nothing changed.
 */
export function updateWatchlistInstrumentTypes(
  config: AppConfig,
  types: ReadonlyMap<string, InstrumentType>,
): AppConfig {
  let changed = false;
  const next = config.watchlist.map((entry) => {
    const t = types.get(entry.ticker);
    if (!t || entry.instrumentType === t) return entry;
    changed = true;
    return { ...entry, instrumentType: t };
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

/**
 * Return a new `AppConfig` with per-card settings for `cardId` updated.
 *
 * This is a pure function — it does not call `saveConfig`.  Callers should
 * call `saveConfig(newConfig)` after applying all desired mutations.
 *
 * @example
 *   const next = setCardSetting(cfg, "watchlist", { visibleColumns: ["ticker", "price"] });
 *   saveConfig(next);
 */
export function setCardSetting<K extends CardId>(
  config: AppConfig,
  cardId: K,
  settings: NonNullable<CardSettingsMap[K]>,
): AppConfig {
  const prev = config.cardSettings ?? {};
  return {
    ...config,
    cardSettings: { ...prev, [cardId]: settings },
  };
}

/**
 * Read per-card settings for a single card from `AppConfig`.
 * Returns `undefined` when no settings have been saved for that card.
 */
export function getCardSetting<K extends CardId>(
  config: AppConfig,
  cardId: K,
): CardSettingsMap[K] | undefined {
  return config.cardSettings?.[cardId];
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

const WEIGHT_KEYS: ReadonlyArray<keyof MethodWeights> = [
  "Micho",
  "RSI",
  "MACD",
  "Bollinger",
  "Stochastic",
  "OBV",
  "ADX",
  "CCI",
  "SAR",
  "WilliamsR",
  "MFI",
  "SuperTrend",
];

/**
 * Parse and validate a raw method-weights value from localStorage.
 * Returns undefined if the input is absent or not a plain object.
 * Individual keys are validated to be finite numbers in [0, 3].
 */
function parseMethodWeights(raw: unknown): MethodWeights | undefined {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const result: MethodWeights = {};
  const obj = raw as Record<string, unknown>;
  let hasAny = false;
  for (const key of WEIGHT_KEYS) {
    const v = obj[key];
    if (v === undefined) continue;
    const n = typeof v === "number" ? v : parseFloat(String(v));
    if (!isFinite(n)) continue;
    result[key] = Math.min(3, Math.max(0, n));
    hasAny = true;
  }
  return hasAny ? result : undefined;
}

function parseCardSettings(raw: unknown): CardSettingsMap | undefined {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const obj = raw as Record<string, unknown>;
  const result: Partial<Record<CardId, unknown>> = {};
  let hasAny = false;

  for (const cardId of CARD_IDS) {
    const rawSettings = obj[cardId];
    if (rawSettings == null || typeof rawSettings !== "object" || Array.isArray(rawSettings)) {
      continue;
    }
    const parsed = parseSingleCardSettings(cardId, rawSettings);
    if (parsed !== undefined) {
      result[cardId] = parsed;
      hasAny = true;
    }
  }
  return hasAny ? (result as CardSettingsMap) : undefined;
}

function parseSingleCardSettings(cardId: CardId, raw: unknown): unknown {
  switch (cardId) {
    case "watchlist": {
      const r = safeParse(WatchlistCardSettingsSchema, raw);
      return r.success ? r.output : undefined;
    }
    case "chart": {
      const r = safeParse(ChartCardSettingsSchema, raw);
      return r.success ? r.output : undefined;
    }
    case "consensus": {
      const r = safeParse(ConsensusCardSettingsSchema, raw);
      return r.success ? r.output : undefined;
    }
    case "screener": {
      const r = safeParse(ScreenerCardSettingsSchema, raw);
      return r.success ? r.output : undefined;
    }
    case "heatmap": {
      const r = safeParse(HeatmapCardSettingsSchema, raw);
      return r.success ? r.output : undefined;
    }
    case "backtest": {
      const r = safeParse(BacktestCardSettingsSchema, raw);
      return r.success ? r.output : undefined;
    }
    case "alerts": {
      const r = safeParse(AlertsCardSettingsSchema, raw);
      return r.success ? r.output : undefined;
    }
    case "portfolio": {
      const r = safeParse(PortfolioCardSettingsSchema, raw);
      return r.success ? r.output : undefined;
    }
    case "risk": {
      const r = safeParse(RiskCardSettingsSchema, raw);
      return r.success ? r.output : undefined;
    }
  }
}
