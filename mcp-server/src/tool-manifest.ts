/**
 * Typed tool manifest for the CrossTide MCP server (E3).
 *
 * The manifest advertises a JSON Schema for every tool, but advertising a
 * schema is not the same as enforcing one: `handleTool` used to reach into the
 * raw argument bag with casts like `args.indicators as string[]`, so a client
 * that ignored the schema produced a `TypeError` from `.join`, or a request to
 * `/api/quote/undefined`, instead of a clear validation error.
 *
 * Each tool therefore carries both its advertised `inputSchema` and a Valibot
 * schema that actually parses the arguments, plus the Worker route it calls.
 * `tests/unit/mcp/tool-manifest.test.ts` asserts the two stay in step and that
 * every route named here is really registered by the Worker.
 */

import * as v from "valibot";

/** Ticker symbols are interpolated into a URL path, so constrain them tightly. */
const SymbolSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1, "symbol is required"),
  v.maxLength(20, "symbol is too long"),
  v.regex(/^[A-Za-z0-9.\-^=:]+$/u, "symbol contains unsupported characters"),
);

const RANGES = ["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "max"] as const;
const INTERVALS = ["1m", "5m", "15m", "1h", "1d", "1wk", "1mo"] as const;
const CONSENSUS = ["BUY", "SELL", "NEUTRAL"] as const;

const IndicatorSchema = v.pipe(
  v.string(),
  v.regex(/^[a-z]+$/u, "indicator names are lowercase letters only"),
);

const Percent = v.pipe(v.number(), v.minValue(0), v.maxValue(100));

export const GetQuoteArgs = v.object({ symbol: SymbolSchema });

export const GetConsensusArgs = v.object({ symbol: SymbolSchema });

export const GetChartDataArgs = v.object({
  symbol: SymbolSchema,
  range: v.optional(v.picklist(RANGES), "3mo"),
  interval: v.optional(v.picklist(INTERVALS), "1d"),
});

export const GetIndicatorsArgs = v.object({
  symbol: SymbolSchema,
  indicators: v.pipe(v.array(IndicatorSchema), v.minLength(1), v.maxLength(20)),
  period: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(500)), 14),
});

export const RunScreenerArgs = v.object({
  tickers: v.pipe(v.array(SymbolSchema), v.minLength(1), v.maxLength(50)),
  minRsi: v.optional(Percent),
  maxRsi: v.optional(Percent),
  minAdx: v.optional(Percent),
  consensus: v.optional(v.picklist(CONSENSUS)),
  minPe: v.optional(v.number()),
  maxPe: v.optional(v.number()),
  minMarketCap: v.optional(v.pipe(v.number(), v.minValue(0))),
  maxMarketCap: v.optional(v.pipe(v.number(), v.minValue(0))),
  minDividendYield: v.optional(v.number()),
  minProfitMargin: v.optional(v.number()),
});

export const GetPortfolioAnalyticsArgs = v.object({
  holdings: v.pipe(
    v.array(
      v.object({
        symbol: SymbolSchema,
        shares: v.pipe(v.number(), v.minValue(0)),
        costBasis: v.pipe(v.number(), v.minValue(0)),
      }),
    ),
    v.minLength(1),
    v.maxLength(200),
  ),
});

/** Worker routes the tools call, in the `METHOD /path` form the drift test parses. */
export const TOOL_ROUTES = {
  get_quote: "GET /api/quote/:symbol",
  get_consensus: "POST /api/screener",
  get_chart_data: "GET /api/chart",
  get_indicators: "GET /api/indicators",
  run_screener: "POST /api/screener",
  get_portfolio_analytics: "POST /api/portfolio/analytics",
} as const;

export type ToolName = keyof typeof TOOL_ROUTES;

/** Valibot schema per tool, keyed by the same names the manifest advertises. */
export const TOOL_SCHEMAS = {
  get_quote: GetQuoteArgs,
  get_consensus: GetConsensusArgs,
  get_chart_data: GetChartDataArgs,
  get_indicators: GetIndicatorsArgs,
  run_screener: RunScreenerArgs,
  get_portfolio_analytics: GetPortfolioAnalyticsArgs,
} as const;

export function isToolName(name: string): name is ToolName {
  return Object.hasOwn(TOOL_SCHEMAS, name);
}

/**
 * Parses raw MCP arguments for a tool, throwing a readable error listing every
 * problem rather than failing later inside a fetch or a `.join`.
 */
export function parseToolArgs<N extends ToolName>(
  name: N,
  args: unknown,
): v.InferOutput<(typeof TOOL_SCHEMAS)[N]> {
  const result = v.safeParse(TOOL_SCHEMAS[name], args ?? {});
  if (!result.success) {
    const detail = result.issues
      .map((issue) => {
        const path = issue.path?.map((segment) => String(segment.key)).join(".") ?? "";
        return path === "" ? issue.message : `${path}: ${issue.message}`;
      })
      .join("; ");
    throw new Error(`Invalid arguments for ${name} — ${detail}`);
  }
  return result.output as v.InferOutput<(typeof TOOL_SCHEMAS)[N]>;
}

/** The manifest advertised to MCP clients over ListTools. */
export const TOOLS = [
  {
    name: "get_quote",
    description: "Get a real-time stock quote including price, change, volume, and market cap",
    inputSchema: {
      type: "object" as const,
      properties: {
        symbol: { type: "string", description: "Ticker symbol (e.g. AAPL, MSFT)" },
      },
      required: ["symbol"],
    },
  },
  {
    name: "get_consensus",
    description:
      "Get the technical consensus signal and score for a ticker from the CrossTide screener",
    inputSchema: {
      type: "object" as const,
      properties: {
        symbol: { type: "string", description: "Ticker symbol" },
      },
      required: ["symbol"],
    },
  },
  {
    name: "get_chart_data",
    description: "Get OHLCV candlestick data for charting and analysis",
    inputSchema: {
      type: "object" as const,
      properties: {
        symbol: { type: "string", description: "Ticker symbol" },
        range: {
          type: "string",
          description: "Time range: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, max",
          enum: ["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "max"],
        },
        interval: {
          type: "string",
          description: "Candle interval: 1m, 5m, 15m, 1h, 1d, 1wk, 1mo",
          enum: ["1m", "5m", "15m", "1h", "1d", "1wk", "1mo"],
        },
      },
      required: ["symbol"],
    },
  },
  {
    name: "get_indicators",
    description:
      "Calculate technical indicators (SMA, EMA, RSI, MACD, Bollinger, etc.) for a ticker",
    inputSchema: {
      type: "object" as const,
      properties: {
        symbol: { type: "string", description: "Ticker symbol" },
        indicators: {
          type: "array",
          items: { type: "string" },
          description:
            "Indicator names: sma, ema, rsi, macd, bollinger, stochastic, adx, obv, vwap, atr",
        },
        period: { type: "number", description: "Lookback period (default: 14)" },
      },
      required: ["symbol", "indicators"],
    },
  },
  {
    name: "run_screener",
    description: "Screen a ticker list by RSI, ADX, consensus, and fundamental criteria",
    inputSchema: {
      type: "object" as const,
      properties: {
        tickers: {
          type: "array",
          items: { type: "string" },
          description: "One to 50 ticker symbols",
        },
        minRsi: { type: "number", description: "Minimum RSI from 0 to 100" },
        maxRsi: { type: "number", description: "Maximum RSI from 0 to 100" },
        minAdx: { type: "number", description: "Minimum ADX from 0 to 100" },
        consensus: { type: "string", enum: ["BUY", "SELL", "NEUTRAL"] },
        minPe: { type: "number" },
        maxPe: { type: "number" },
        minMarketCap: { type: "number", description: "Minimum market cap in USD" },
        maxMarketCap: { type: "number", description: "Maximum market cap in USD" },
        minDividendYield: { type: "number", description: "Minimum decimal dividend yield" },
        minProfitMargin: { type: "number", description: "Minimum decimal profit margin" },
      },
      required: ["tickers"],
    },
  },
  {
    name: "get_portfolio_analytics",
    description: "Calculate portfolio allocation, profit and loss, and concentration analytics",
    inputSchema: {
      type: "object" as const,
      properties: {
        holdings: {
          type: "array",
          items: {
            type: "object",
            properties: {
              symbol: { type: "string" },
              shares: { type: "number" },
              costBasis: { type: "number", description: "Per-share cost basis" },
            },
            required: ["symbol", "shares", "costBasis"],
          },
        },
      },
      required: ["holdings"],
    },
  },
] as const;
