/**
 * Alpaca Markets Worker provider — real-time US equity quotes and OHLCV history.
 *
 * Q1: Co-primary data source alongside Yahoo Finance.
 * Free tier (IEX): unlimited requests for IEX-sourced real-time data.
 * Paper trading account: full real-time market data at $0.
 *
 * Endpoints used:
 *  - GET /v2/stocks/{symbol}/quotes/latest  → real-time quote
 *  - GET /v2/stocks/{symbol}/bars           → OHLCV bars
 *  - GET /v2/stocks/{symbol}/snapshot       → snapshot (quote + bar + trade)
 *  - GET /v1beta1/screener/stocks/most-actives → market movers
 */

const ALPACA_DATA_BASE = "https://data.alpaca.markets";

// ── Error ─────────────────────────────────────────────────────────────────────

export class AlpacaApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AlpacaApiError";
    this.status = status;
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AlpacaQuoteResult {
  readonly ticker: string;
  readonly price: number;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly previousClose: number;
  readonly change: number;
  readonly changePercent: number;
  readonly volume: number;
  readonly timestamp: number;
  readonly source: string;
}

export interface AlpacaCandle {
  readonly date: string;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number;
}

export interface AlpacaChartResult {
  readonly ticker: string;
  readonly candles: readonly AlpacaCandle[];
  readonly source: string;
}

// ── Internal raw response shapes ──────────────────────────────────────────────

interface AlpacaSnapshotRaw {
  latestTrade?: { p?: number; s?: number; t?: string };
  latestQuote?: { ap?: number; bp?: number; as?: number; bs?: number; t?: string };
  minuteBar?: { o?: number; h?: number; l?: number; c?: number; v?: number; t?: string };
  dailyBar?: { o?: number; h?: number; l?: number; c?: number; v?: number; t?: string };
  prevDailyBar?: { o?: number; h?: number; l?: number; c?: number; v?: number; t?: string };
}

interface AlpacaBarRaw {
  t: string; // timestamp ISO
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
  v: number; // volume
  n: number; // number of trades
  vw: number; // VWAP
}

interface AlpacaBarsResponse {
  bars?: AlpacaBarRaw[];
  next_page_token?: string | null;
  symbol?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function alpacaHeaders(apiKey: string, apiSecret: string): Record<string, string> {
  return {
    "APCA-API-KEY-ID": apiKey,
    "APCA-API-SECRET-KEY": apiSecret,
    Accept: "application/json",
  };
}

async function alpacaFetch(url: string, apiKey: string, apiSecret: string): Promise<unknown> {
  const res = await fetch(url, { headers: alpacaHeaders(apiKey, apiSecret) });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new AlpacaApiError(`Alpaca ${res.status}: ${body.slice(0, 200)}`, res.status);
  }
  return res.json();
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetch a real-time snapshot for a US equity symbol.
 * Uses the /v2/stocks/{symbol}/snapshot endpoint.
 */
export async function fetchAlpacaQuote(
  symbol: string,
  apiKey: string,
  apiSecret: string,
): Promise<AlpacaQuoteResult> {
  const url = `${ALPACA_DATA_BASE}/v2/stocks/${encodeURIComponent(symbol)}/snapshot`;
  const raw = (await alpacaFetch(url, apiKey, apiSecret)) as AlpacaSnapshotRaw;

  const trade = raw.latestTrade;
  const daily = raw.dailyBar;
  const prev = raw.prevDailyBar;

  const price = trade?.p ?? daily?.c ?? 0;
  const prevClose = prev?.c ?? 0;
  const change = prevClose > 0 ? price - prevClose : 0;
  const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

  return {
    ticker: symbol.toUpperCase(),
    price,
    open: daily?.o ?? 0,
    high: daily?.h ?? 0,
    low: daily?.l ?? 0,
    previousClose: prevClose,
    change,
    changePercent,
    volume: daily?.v ?? 0,
    timestamp: trade?.t ? new Date(trade.t).getTime() : Date.now(),
    source: "alpaca",
  };
}

/**
 * Fetch OHLCV bar history for a US equity symbol.
 * Uses the /v2/stocks/{symbol}/bars endpoint with daily timeframe.
 */
export async function fetchAlpacaHistory(
  symbol: string,
  days: number,
  apiKey: string,
  apiSecret: string,
): Promise<AlpacaChartResult> {
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);

  const params = new URLSearchParams({
    timeframe: "1Day",
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    limit: String(Math.min(days, 10000)),
    adjustment: "all",
    feed: "iex",
    sort: "asc",
  });

  const url = `${ALPACA_DATA_BASE}/v2/stocks/${encodeURIComponent(symbol)}/bars?${params}`;
  const raw = (await alpacaFetch(url, apiKey, apiSecret)) as AlpacaBarsResponse;

  const bars = raw.bars ?? [];
  const candles: AlpacaCandle[] = bars.map((bar) => ({
    date: bar.t.slice(0, 10),
    open: bar.o,
    high: bar.h,
    low: bar.l,
    close: bar.c,
    volume: bar.v,
  }));

  return {
    ticker: symbol.toUpperCase(),
    candles,
    source: "alpaca",
  };
}
