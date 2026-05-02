/**
 * Valibot runtime schemas for boundary validation.
 *
 * These schemas validate and type-narrow raw JSON from data providers,
 * localStorage, and message handlers before it enters the typed domain.
 * Using Valibot (~3 KB gz) instead of Zod keeps the bundle small.
 *
 * Usage:
 *   import { safeParse, parse } from 'valibot';
 *   import { YahooChartSchema } from './valibot-schemas';
 *   const result = safeParse(YahooChartSchema, raw);
 *   if (!result.success) throw new Error('Bad response shape');
 *   const data = result.output;
 */
import {
  object,
  string,
  number,
  array,
  nullable,
  optional,
  boolean,
  union,
  literal,
  picklist,
  pipe,
  minLength,
  minValue,
  maxValue,
  integer,
  transform,
  check,
  parse,
  ValiError,
} from "valibot";
import {
  ticker as toTicker,
  isoTimestamp as toIsoTimestamp,
  uuid as toUuid,
  nonNegativeInt as toNonNegativeInt,
  nonNegativeNumber as toNonNegativeNumber,
  unitInterval as toUnitInterval,
  type Ticker,
  type IsoTimestamp,
  type Uuid,
  type NonNegativeInt,
  type NonNegativeNumber,
  type UnitInterval,
} from "./branded";

// ---------------------------------------------------------------------------
// Domain-level schemas
// ---------------------------------------------------------------------------

/** ISO-8601 date string (YYYY-MM-DD). */
export const IsoDateSchema = pipe(
  string(),
  minLength(10),
  check((s: string) => /^\d{4}-\d{2}-\d{2}/.test(s), "Not an ISO-8601 date"),
  transform((s: string) => s.slice(0, 10)),
);

/** Non-negative finite number (price, volume, etc.). */
export const NonNegativeNumberSchema = pipe(number(), minValue(0));

/** Ticker symbol — non-empty string. */
export const TickerStringSchema = pipe(string(), minLength(1));

// ---------------------------------------------------------------------------
// DailyCandle schema
// ---------------------------------------------------------------------------

export const DailyCandleSchema = object({
  date: IsoDateSchema,
  open: NonNegativeNumberSchema,
  high: NonNegativeNumberSchema,
  low: NonNegativeNumberSchema,
  close: NonNegativeNumberSchema,
  volume: NonNegativeNumberSchema,
});

// ---------------------------------------------------------------------------
// Yahoo Finance v8 chart API schemas
// ---------------------------------------------------------------------------

const YahooOhlcvSchema = object({
  open: optional(array(nullable(number()))),
  high: optional(array(nullable(number()))),
  low: optional(array(nullable(number()))),
  close: optional(array(nullable(number()))),
  volume: optional(array(nullable(number()))),
});

const YahooMetaSchema = object({
  regularMarketPrice: optional(number()),
  previousClose: optional(number()),
  symbol: optional(string()),
  shortName: optional(string()),
  longName: optional(string()),
  instrumentType: optional(string()),
  sector: optional(string()),
});

const YahooResultSchema = object({
  meta: optional(YahooMetaSchema),
  timestamp: optional(array(number())),
  indicators: optional(
    object({
      quote: optional(array(YahooOhlcvSchema)),
    }),
  ),
});

export const YahooChartSchema = object({
  chart: optional(
    object({
      result: optional(array(YahooResultSchema)),
      error: optional(
        nullable(object({ code: optional(string()), description: optional(string()) })),
      ),
    }),
  ),
});

// ---------------------------------------------------------------------------
// Yahoo Finance symbol search API schema
// ---------------------------------------------------------------------------

const YahooSearchItemSchema = object({
  symbol: optional(string()),
  shortname: optional(string()),
  longname: optional(string()),
  exchDisp: optional(string()),
  quoteType: optional(string()),
});

export const YahooSearchSchema = object({
  quotes: optional(array(YahooSearchItemSchema)),
});

// ---------------------------------------------------------------------------
// Finnhub quote schema
// ---------------------------------------------------------------------------

export const FinnhubQuoteSchema = object({
  c: number(), // current price
  o: number(), // open
  h: number(), // high
  l: number(), // low
  pc: number(), // previous close
  t: optional(number()), // unix timestamp
});

// ---------------------------------------------------------------------------
// Finnhub candle schema
// ---------------------------------------------------------------------------

export const FinnhubCandleSchema = object({
  s: union([literal("ok"), literal("no_data")]),
  t: optional(array(number())),
  o: optional(array(number())),
  h: optional(array(number())),
  l: optional(array(number())),
  c: optional(array(number())),
  v: optional(array(number())),
});

// ---------------------------------------------------------------------------
// Finnhub search schema
// ---------------------------------------------------------------------------

const FinnhubSearchItemSchema = object({
  description: string(),
  displaySymbol: string(),
  symbol: string(),
  type: string(),
});

export const FinnhubSearchSchema = object({
  result: optional(array(FinnhubSearchItemSchema)),
});

// ---------------------------------------------------------------------------
// CoinGecko quote schema (for crypto providers)
// ---------------------------------------------------------------------------

export const CoinGeckoMarketDataSchema = object({
  id: string(),
  symbol: string(),
  name: string(),
  current_price: optional(number()),
  high_24h: optional(number()),
  low_24h: optional(number()),
  price_change_24h: optional(number()),
  total_volume: optional(number()),
  market_cap: optional(number()),
  last_updated: optional(string()),
  ath: optional(number()),
  atl: optional(number()),
  sparkline_in_7d: optional(
    object({
      price: optional(array(number())),
    }),
  ),
});

export const CoinGeckoMarketsSchema = array(CoinGeckoMarketDataSchema);

// ---------------------------------------------------------------------------
// CoinGecko simple/price schema (for getQuote)
// ---------------------------------------------------------------------------

/** CoinGecko /simple/price response: { [coinId]: { usd, usd_24h_change, ... } } */
export const CoinGeckoSimplePriceEntrySchema = object({
  usd: optional(number()),
  usd_24h_change: optional(number()),
  usd_24h_vol: optional(number()),
  last_updated_at: optional(number()),
});

/** CoinGecko /coins/:id/ohlc response — array of [timestamp, o, h, l, c] tuples. */
export const CoinGeckoOhlcSchema = array(array(number()));

/** CoinGecko /search response. */
export const CoinGeckoSearchSchema = object({
  coins: optional(
    array(
      object({
        id: string(),
        name: string(),
        symbol: string(),
      }),
    ),
  ),
});

// ---------------------------------------------------------------------------
// Polygon.io schemas
// ---------------------------------------------------------------------------

const PolygonAggBarSchema = object({
  T: optional(string()),
  o: number(),
  h: number(),
  l: number(),
  c: number(),
  v: number(),
  t: number(),
});

export const PolygonPrevCloseSchema = object({
  results: optional(array(PolygonAggBarSchema)),
  status: optional(string()),
});

export const PolygonAggsSchema = object({
  results: optional(
    array(
      object({
        o: number(),
        h: number(),
        l: number(),
        c: number(),
        v: number(),
        t: number(),
      }),
    ),
  ),
  status: optional(string()),
});

const PolygonTickerItemSchema = object({
  ticker: string(),
  name: string(),
  primary_exchange: optional(string()),
  type: optional(string()),
});

export const PolygonTickersSchema = object({
  results: optional(array(PolygonTickerItemSchema)),
  status: optional(string()),
});

// ---------------------------------------------------------------------------
// Branded primitive schemas (mirror zod-schemas branded transforms)
// ---------------------------------------------------------------------------

export const TickerSchema = pipe(
  string(),
  check((s: string) => {
    try {
      toTicker(s);
      return true;
    } catch {
      return false;
    }
  }, "Invalid ticker symbol"),
  transform((s: string): Ticker => toTicker(s)),
);

export const IsoTimestampSchema = pipe(
  string(),
  check((s: string) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(s), "Not an ISO-8601 timestamp"),
  transform((s: string): IsoTimestamp => toIsoTimestamp(s)),
);

export const UuidSchema = pipe(
  string(),
  check(
    (s: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(s),
    "Not a valid UUID",
  ),
  transform((s: string): Uuid => toUuid(s)),
);

export const NonNegativeIntSchema = pipe(
  number(),
  minValue(0),
  integer(),
  transform((n: number): NonNegativeInt => toNonNegativeInt(n)),
);

export const NonNegativeNumberSchema2 = pipe(
  number(),
  minValue(0),
  transform((n: number): NonNegativeNumber => toNonNegativeNumber(n)),
);

export const UnitIntervalSchema = pipe(
  number(),
  minValue(0),
  maxValue(1),
  transform((n: number): UnitInterval => toUnitInterval(n)),
);

// ---------------------------------------------------------------------------
// Domain enum / picklist schemas
// ---------------------------------------------------------------------------

export const SignalDirectionSchema = picklist(["BUY", "SELL", "NEUTRAL"] as const);

export const MethodNameSchema = picklist([
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
  "Consensus",
] as const);

export const ThemeSchema = picklist(["dark", "light", "high-contrast"] as const);

// ---------------------------------------------------------------------------
// Domain object schemas
// ---------------------------------------------------------------------------

export const MethodSignalSchema = object({
  ticker: TickerSchema,
  method: MethodNameSchema,
  direction: SignalDirectionSchema,
  description: string(),
  currentClose: NonNegativeNumberSchema,
  evaluatedAt: IsoTimestampSchema,
});

export const ConsensusResultSchema = object({
  ticker: TickerSchema,
  direction: SignalDirectionSchema,
  buyMethods: array(MethodSignalSchema),
  sellMethods: array(MethodSignalSchema),
  strength: UnitIntervalSchema,
});

export const WatchlistEntrySchema = object({
  ticker: TickerSchema,
  addedAt: string(),
});

/**
 * Per-method weight map schema.
 * All method keys are optional; values are clamped to [0, 3] at runtime.
 * The schema accepts any subset of method names — missing keys fall back to defaults.
 */
export const MethodWeightsSchema = object({
  Micho: optional(pipe(number(), minValue(0), maxValue(3))),
  RSI: optional(pipe(number(), minValue(0), maxValue(3))),
  MACD: optional(pipe(number(), minValue(0), maxValue(3))),
  Bollinger: optional(pipe(number(), minValue(0), maxValue(3))),
  Stochastic: optional(pipe(number(), minValue(0), maxValue(3))),
  OBV: optional(pipe(number(), minValue(0), maxValue(3))),
  ADX: optional(pipe(number(), minValue(0), maxValue(3))),
  CCI: optional(pipe(number(), minValue(0), maxValue(3))),
  SAR: optional(pipe(number(), minValue(0), maxValue(3))),
  WilliamsR: optional(pipe(number(), minValue(0), maxValue(3))),
  MFI: optional(pipe(number(), minValue(0), maxValue(3))),
  SuperTrend: optional(pipe(number(), minValue(0), maxValue(3))),
});

/** G24: typed per-card settings schemas. */
export const WatchlistCardSettingsSchema = object({
  visibleColumns: array(string()),
  autoRefreshSec: pipe(number(), integer(), minValue(5), maxValue(3600)),
  density: picklist(["compact", "comfortable"] as const),
});

export const ChartCardSettingsSchema = object({
  defaultInterval: picklist(["1d", "1w", "1m"] as const),
  indicatorSet: array(string()),
  crosshairSnap: boolean(),
});

export const ConsensusCardSettingsSchema = object({
  methodsToDisplay: array(MethodNameSchema),
  historyDepth: pipe(number(), integer(), minValue(10), maxValue(500)),
});

export const ScreenerCardSettingsSchema = object({
  defaultPreset: picklist(["balanced", "momentum", "value"] as const),
  maxResults: pipe(number(), integer(), minValue(10), maxValue(500)),
  sortColumn: picklist(["ticker", "price", "consensus"] as const),
});

export const HeatmapCardSettingsSchema = object({
  colorScale: picklist(["diverging", "sequential"] as const),
  cellLabelFormat: picklist(["ticker", "ticker-change"] as const),
});

export const BacktestCardSettingsSchema = object({
  defaultStrategy: string(),
  lookbackWindow: pipe(number(), integer(), minValue(20), maxValue(500)),
  benchmark: string(),
});

export const AlertsCardSettingsSchema = object({
  thresholdType: picklist(["percent", "absolute"] as const),
  notificationChannel: picklist(["toast", "push"] as const),
});

export const PortfolioCardSettingsSchema = object({
  benchmarkTicker: string(),
  displayCurrency: picklist(["USD", "EUR", "ILS"] as const),
});

export const RiskCardSettingsSchema = object({
  varConfidence: pipe(number(), minValue(0.8), maxValue(0.999)),
  benchmark: string(),
});

export const AppConfigSchema = object({
  theme: ThemeSchema,
  watchlist: array(WatchlistEntrySchema),
  // G20/G24: methodWeights/cardSettings are parsed manually in config.ts
  // to keep exactOptionalPropertyTypes clean.
});

// ---------------------------------------------------------------------------
// Tiingo schemas (H15) — EOD history, IEX quote, search
// ---------------------------------------------------------------------------

/** Tiingo IEX real-time quote — /iex?tickers={t}&token={k} */
export const TiingoQuoteItemSchema = object({
  ticker: string(),
  last: optional(number()),
  prevClose: optional(number()),
  high: optional(number()),
  low: optional(number()),
  open: optional(number()),
  volume: optional(number()),
  timestamp: optional(string()), // ISO 8601
});
export const TiingoQuoteSchema = array(TiingoQuoteItemSchema);

/** Tiingo EOD prices — /tiingo/daily/{ticker}/prices */
export const TiingoEodItemSchema = object({
  date: string(),
  open: optional(number()),
  high: optional(number()),
  low: optional(number()),
  close: optional(number()),
  volume: optional(number()),
  adjClose: optional(number()),
});
export const TiingoEodSchema = array(TiingoEodItemSchema);

/** Tiingo symbol search — /tiingo/utilities/search */
export const TiingoSearchItemSchema = object({
  ticker: string(),
  name: string(),
  exchange: optional(string()),
  assetType: optional(string()),
});
export const TiingoSearchSchema = array(TiingoSearchItemSchema);

// ---------------------------------------------------------------------------
// Twelve Data schema (legacy — Twelve Data is being retired from provider chain;
// kept for schema-version migration compatibility)
// ---------------------------------------------------------------------------

export const TwelveDataTimeSeriesSchema = object({
  status: optional(string()),
  values: optional(
    array(
      object({
        datetime: string(),
        open: string(),
        high: string(),
        low: string(),
        close: string(),
        volume: optional(string()),
      }),
    ),
  ),
});

// ---------------------------------------------------------------------------
// Helper utilities (mirror of former zod-schemas helpers)
// ---------------------------------------------------------------------------

export type ValibotIssueDetail = { path: string; message: string };

/** Minimum structural shape of a Valibot issue for flattening. */
interface FlatIssue {
  message: string;
  path?: Array<{ key?: unknown }>;
}

/** Flatten Valibot issues into a simple path → message list. */
export function flattenIssues(error: { issues: FlatIssue[] }): ValibotIssueDetail[] {
  const result: ValibotIssueDetail[] = [];
  for (const issue of error.issues) {
    const path =
      issue.path
        ?.map((seg) => String(seg.key ?? ""))
        .filter(Boolean)
        .join(".") ?? "";
    result.push({ path, message: issue.message });
  }
  return result;
}

/**
 * Parse with a clear error including the schema name and the first few issues.
 * Throws on failure.
 */
export function parseOrThrow<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: any,
  value: unknown,
  schemaName: string,
): T {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (parse as any)(schema, value) as T;
  } catch (e) {
    if (e instanceof ValiError) {
      const issues = flattenIssues(e as { issues: FlatIssue[] }).slice(0, 3);
      throw new Error(
        `${schemaName} validation failed: ${issues
          .map((i) => `${i.path || "<root>"}: ${i.message}`)
          .join("; ")}`,
        { cause: e },
      );
    }
    throw e;
  }
}

// ---------------------------------------------------------------------------
// Re-export inferred output types for use in providers
// ---------------------------------------------------------------------------
export type { InferOutput } from "valibot";

// Convenience re-export so providers only need one import
export { safeParse, parse, ValiError } from "valibot";
