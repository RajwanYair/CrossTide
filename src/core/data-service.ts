/**
 * Data Service — orchestrates live market data fetching and consensus computation.
 *
 * Uses Yahoo Finance v8 chart API with a configurable CORS proxy.
 * Runs the full 12-method consensus engine on fetched candle data.
 */
import type { DailyCandle, ConsensusResult, InstrumentType, MethodWeights } from "../types/domain";
import { aggregateConsensus } from "../domain/signal-aggregator";
import { fetchWithTimeout } from "./fetch";
import { safeParse, YahooChartSchema } from "../types/valibot-schemas";
import { markFetched } from "./data-freshness";

/**
 * Base URL for Yahoo Finance requests.
 *
 * In dev mode, requests go through the Vite dev-server proxy (/api/yahoo/*)
 * which uses https-proxy-agent to honour HTTPS_PROXY env vars — required on
 * corporate networks behind a firewall.  The proxy also avoids CSP
 * connect-src violations since the browser only sees a same-origin request.
 *
 * In production, Yahoo Finance v8 chart API returns
 * "Access-Control-Allow-Origin: *" so the browser calls it directly.
 */
const YAHOO_BASE: string = import.meta.env.DEV ? "/api/yahoo" : "https://query1.finance.yahoo.com";

export interface TickerData {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  avgVolume: number;
  high52w: number;
  low52w: number;
  closes30d: readonly number[];
  consensus: ConsensusResult | null;
  candles: readonly DailyCandle[];
  /** Instrument classification derived from Yahoo `instrumentType` field. */
  instrumentType?: InstrumentType;
  /** GICS sector from Yahoo Finance (equity only). */
  sector?: string;
  /** Company / fund display name from Yahoo Finance `shortName` / `longName`. */
  name?: string;
  error?: string;
}

/** Map Yahoo Finance instrumentType string to our domain InstrumentType. */
function parseInstrumentType(raw: string | undefined): InstrumentType | undefined {
  if (!raw) return undefined;
  const upper = raw.toUpperCase();
  if (upper === "EQUITY") return "stock";
  if (upper === "ETF") return "etf";
  if (upper === "CRYPTOCURRENCY") return "crypto";
  return "other";
}

interface CandleResult {
  candles: DailyCandle[];
  instrumentType: InstrumentType | undefined;
  sector: string | undefined;
  /** Company/fund display name from Yahoo Finance `shortName` (may be absent). */
  name: string | undefined;
}

/**
 * Chart timeframe presets — range + interval combinations.
 */
export interface TimeframePreset {
  label: string;
  range: string;
  interval: string;
}

export const TIMEFRAME_PRESETS: TimeframePreset[] = [
  { label: "1D", range: "1d", interval: "5m" },
  { label: "5D", range: "5d", interval: "15m" },
  { label: "1M", range: "1mo", interval: "1h" },
  { label: "3M", range: "3mo", interval: "1d" },
  { label: "1Y", range: "1y", interval: "1d" },
  { label: "5Y", range: "5y", interval: "1wk" },
];

export const DEFAULT_TIMEFRAME: TimeframePreset = TIMEFRAME_PRESETS[4]!; // 1Y

/**
 * Fetch history candles from Yahoo Finance for a single ticker.
 * Uses 1-year range by default to have enough data for all indicators (SMA150 needs 151+ candles).
 */
async function fetchCandles(
  ticker: string,
  signal?: AbortSignal,
  timeframe: TimeframePreset = DEFAULT_TIMEFRAME,
): Promise<CandleResult> {
  const url = `${YAHOO_BASE}/v8/finance/chart/${encodeURIComponent(ticker)}?range=${timeframe.range}&interval=${timeframe.interval}`;
  const res = await fetchWithTimeout(url, {}, 15000, signal);
  const raw: unknown = await res.json();

  // Validate response shape at the external boundary
  const parsed = safeParse(YahooChartSchema, raw);
  if (!parsed.success) {
    throw new Error(`Invalid Yahoo Finance response for ${ticker}`);
  }
  const data = parsed.output;
  const result = data.chart?.result?.[0];

  if (!result?.timestamp || !result.indicators?.quote?.[0]) {
    throw new Error(`No data returned for ${ticker}`);
  }

  const q = result.indicators.quote[0];
  const candles: DailyCandle[] = [];

  for (let i = 0; i < result.timestamp.length; i++) {
    const o = q.open?.[i];
    const h = q.high?.[i];
    const l = q.low?.[i];
    const c = q.close?.[i];
    const v = q.volume?.[i];
    if (o == null || h == null || l == null || c == null) continue;

    candles.push({
      date: new Date(result.timestamp[i]! * 1000).toISOString().slice(0, 10),
      open: o,
      high: h,
      low: l,
      close: c,
      volume: v ?? 0,
    });
  }

  return {
    candles,
    instrumentType: parseInstrumentType(result.meta?.instrumentType),
    sector: result.meta?.sector,
    name: result.meta?.shortName ?? result.meta?.longName,
  };
}

/**
 * Fetch full ticker data: price, change, volume stats, 52W range, and consensus.
 * Pass a navigation `signal` (from `getNavigationSignal()`) to auto-cancel on route change.
 */
export async function fetchTickerData(
  ticker: string,
  signal?: AbortSignal,
  weights?: MethodWeights,
  timeframe?: TimeframePreset,
): Promise<TickerData> {
  try {
    const { candles, instrumentType, sector, name } = await fetchCandles(ticker, signal, timeframe);

    if (candles.length === 0) {
      return emptyData(ticker, "No candle data available");
    }

    const last = candles[candles.length - 1]!;
    const prev = candles.length >= 2 ? candles[candles.length - 2]! : last;
    const price = last.close;
    const change = price - prev.close;
    const changePercent = prev.close !== 0 ? (change / prev.close) * 100 : 0;

    // Volume: current vs 20-day average
    const recentCandles = candles.slice(-20);
    const avgVolume =
      recentCandles.length > 0
        ? recentCandles.reduce((sum, c) => sum + c.volume, 0) / recentCandles.length
        : 0;

    // 52-week high/low (use all available candles, up to ~252 trading days)
    const yearCandles = candles.slice(-252);
    let high52w = -Infinity;
    let low52w = Infinity;
    for (const c of yearCandles) {
      if (c.high > high52w) high52w = c.high;
      if (c.low < low52w) low52w = c.low;
    }

    // 30-day closes for sparkline
    const closes30d = candles.slice(-30).map((c) => c.close);

    // Run consensus engine (all 12 methods, optional per-method weights)
    const consensus = candles.length >= 151 ? aggregateConsensus(ticker, candles, weights) : null;

    // Track data freshness for staleness indicators
    markFetched(ticker);

    return {
      ticker,
      price,
      change,
      changePercent,
      volume: last.volume,
      avgVolume,
      high52w: high52w === -Infinity ? 0 : high52w,
      low52w: low52w === Infinity ? 0 : low52w,
      closes30d,
      consensus,
      candles,
      ...(instrumentType !== undefined && { instrumentType }),
      ...(sector !== undefined && { sector }),
      ...(name !== undefined && { name }),
    };
  } catch (err) {
    return emptyData(ticker, err instanceof Error ? err.message : String(err));
  }
}

/**
 * Fetch data for all tickers in parallel (with concurrency limit).
 * Pass a navigation `signal` to cancel the whole batch on route change.
 */
export async function fetchAllTickers(
  tickers: readonly string[],
  onProgress?: (done: number, total: number) => void,
  signal?: AbortSignal,
  weights?: MethodWeights,
): Promise<Map<string, TickerData>> {
  const results = new Map<string, TickerData>();
  const CONCURRENCY = 3;
  let done = 0;

  const queue = [...tickers];
  const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    while (queue.length > 0) {
      if (signal?.aborted) break;
      const ticker = queue.shift()!;
      const data = await fetchTickerData(ticker, signal, weights);
      results.set(ticker, data);
      done++;
      onProgress?.(done, tickers.length);
    }
  });

  await Promise.all(workers);
  return results;
}

function emptyData(ticker: string, error: string): TickerData {
  return {
    ticker,
    price: 0,
    change: 0,
    changePercent: 0,
    volume: 0,
    avgVolume: 0,
    high52w: 0,
    low52w: 0,
    closes30d: [],
    consensus: null,
    candles: [],
    error,
  };
}
