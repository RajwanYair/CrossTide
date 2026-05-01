/**
 * Zod runtime schemas for boundary validation.
 *
 * Use these in providers, importers, and message handlers to validate
 * untrusted JSON before letting it into the typed domain.
 *
 * Each schema mirrors a domain type from `./domain` and from
 * provider response shapes. Branded primitives use the smart constructors
 * in `./branded` so we get nominal typing for free.
 */
import { z } from "zod";
import {
  ticker as toTicker,
  isoDate as toIsoDate,
  isoTimestamp as toIsoTimestamp,
  uuid as toUuid,
  nonNegativeInt as toNonNegativeInt,
  nonNegativeNumber as toNonNegativeNumber,
  unitInterval as toUnitInterval,
  type Ticker,
  type IsoDate,
  type IsoTimestamp,
  type Uuid,
  type NonNegativeInt,
  type NonNegativeNumber,
  type UnitInterval,
} from "./branded";

// --- branded primitive schemas ---------------------------------------------

export const TickerSchema = z.string().transform((s, ctx): Ticker => {
  try {
    return toTicker(s);
  } catch (e) {
    ctx.addIssue({ code: "custom", message: (e as Error).message });
    return z.NEVER;
  }
});

export const IsoDateSchema = z.string().transform((s, ctx): IsoDate => {
  try {
    return toIsoDate(s);
  } catch (e) {
    ctx.addIssue({ code: "custom", message: (e as Error).message });
    return z.NEVER;
  }
});

export const IsoTimestampSchema = z.string().transform((s, ctx): IsoTimestamp => {
  try {
    return toIsoTimestamp(s);
  } catch (e) {
    ctx.addIssue({ code: "custom", message: (e as Error).message });
    return z.NEVER;
  }
});

export const UuidSchema = z.string().transform((s, ctx): Uuid => {
  try {
    return toUuid(s);
  } catch (e) {
    ctx.addIssue({ code: "custom", message: (e as Error).message });
    return z.NEVER;
  }
});

export const NonNegativeIntSchema = z.number().transform((n, ctx): NonNegativeInt => {
  try {
    return toNonNegativeInt(n);
  } catch (e) {
    ctx.addIssue({ code: "custom", message: (e as Error).message });
    return z.NEVER;
  }
});

export const NonNegativeNumberSchema = z.number().transform((n, ctx): NonNegativeNumber => {
  try {
    return toNonNegativeNumber(n);
  } catch (e) {
    ctx.addIssue({ code: "custom", message: (e as Error).message });
    return z.NEVER;
  }
});

export const UnitIntervalSchema = z.number().transform((n, ctx): UnitInterval => {
  try {
    return toUnitInterval(n);
  } catch (e) {
    ctx.addIssue({ code: "custom", message: (e as Error).message });
    return z.NEVER;
  }
});

// --- domain schemas --------------------------------------------------------

export const SignalDirectionSchema = z.enum(["BUY", "SELL", "NEUTRAL"]);

export const MethodNameSchema = z.enum([
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
]);

export const DailyCandleSchema = z.object({
  date: IsoDateSchema,
  open: NonNegativeNumberSchema,
  high: NonNegativeNumberSchema,
  low: NonNegativeNumberSchema,
  close: NonNegativeNumberSchema,
  volume: NonNegativeNumberSchema,
});

export const MethodSignalSchema = z.object({
  ticker: TickerSchema,
  method: MethodNameSchema,
  direction: SignalDirectionSchema,
  description: z.string(),
  currentClose: NonNegativeNumberSchema,
  evaluatedAt: IsoTimestampSchema,
});

export const ConsensusResultSchema = z.object({
  ticker: TickerSchema,
  direction: SignalDirectionSchema,
  buyMethods: z.array(MethodSignalSchema),
  sellMethods: z.array(MethodSignalSchema),
  strength: UnitIntervalSchema,
});

export const WatchlistEntrySchema = z.object({
  ticker: TickerSchema,
  addedAt: IsoTimestampSchema,
});

export const ThemeSchema = z.enum(["dark", "light", "high-contrast"]);

export const AppConfigSchema = z.object({
  theme: ThemeSchema,
  watchlist: z.array(WatchlistEntrySchema),
});

// --- provider response shapes ----------------------------------------------

/**
 * Yahoo Finance chart endpoint shape (subset we actually consume).
 * The schema is permissive on optional fields and validates the indicator
 * series counts match the timestamps array.
 */
export const YahooChartSchema = z.object({
  chart: z.object({
    result: z
      .array(
        z.object({
          meta: z.object({ symbol: z.string() }).passthrough(),
          timestamp: z.array(z.number()),
          indicators: z.object({
            quote: z
              .array(
                z.object({
                  open: z.array(z.number().nullable()),
                  high: z.array(z.number().nullable()),
                  low: z.array(z.number().nullable()),
                  close: z.array(z.number().nullable()),
                  volume: z.array(z.number().nullable()),
                }),
              )
              .min(1),
          }),
        }),
      )
      .min(1),
    error: z.unknown().nullable().optional(),
  }),
});

/** Polygon `/v2/aggs/ticker` response. */
export const PolygonAggsSchema = z.object({
  ticker: z.string().optional(),
  status: z.string(),
  resultsCount: z.number().int().nonnegative().optional(),
  results: z
    .array(
      z.object({
        t: z.number(), // unix ms
        o: z.number(),
        h: z.number(),
        l: z.number(),
        c: z.number(),
        v: z.number(),
      }),
    )
    .optional(),
});

/** CoinGecko `/coins/{id}/ohlc` response — array of [t, o, h, l, c]. */
export const CoinGeckoOhlcSchema = z.array(
  z.tuple([z.number(), z.number(), z.number(), z.number(), z.number()]),
);

/** Twelve Data `time_series` response. */
export const TwelveDataTimeSeriesSchema = z.object({
  status: z.string().optional(),
  values: z
    .array(
      z.object({
        datetime: z.string(),
        open: z.string(),
        high: z.string(),
        low: z.string(),
        close: z.string(),
        volume: z.string().optional(),
      }),
    )
    .optional(),
});

// --- helpers ---------------------------------------------------------------

export type ZodIssueDetail = { path: string; message: string };

export function flattenIssues(error: z.ZodError): ZodIssueDetail[] {
  return error.issues.map((i) => ({
    path: i.path.map(String).join("."),
    message: i.message,
  }));
}

/**
 * Parse with a clear error including the schema name and the first few issues.
 * Throws on failure.
 */
export function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, schemaName: string): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    const issues = flattenIssues(result.error).slice(0, 3);
    throw new Error(
      `${schemaName} validation failed: ${issues
        .map((i) => `${i.path || "<root>"}: ${i.message}`)
        .join("; ")}`,
    );
  }
  return result.data;
}
