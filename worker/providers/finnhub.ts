/**
 * Finnhub Worker provider — quote, candle history, and symbol search.
 *
 * P7: Server-side Finnhub integration (API key stays on Worker, never in browser).
 * Free tier: 60 requests/minute.
 *
 * Endpoints used:
 *  - GET /api/v1/quote?symbol=AAPL           → real-time quote
 *  - GET /api/v1/stock/candle?symbol=…&…     → OHLCV candles
 *  - GET /api/v1/search?q=…                  → symbol search
 */

const FINNHUB_BASE = "https://finnhub.io/api/v1";

// ── Error ─────────────────────────────────────────────────────────────────────

export class FinnhubApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "FinnhubApiError";
    this.status = status;
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FinnhubQuoteResult {
  readonly ticker: string;
  readonly price: number;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly previousClose: number;
  readonly change: number;
  readonly changePercent: number;
  readonly timestamp: number;
  readonly source: string;
}

export interface FinnhubCandle {
  readonly date: string;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number;
}

export interface FinnhubChartResult {
  readonly ticker: string;
  readonly candles: readonly FinnhubCandle[];
  readonly source: string;
}

export interface FinnhubSearchHit {
  readonly symbol: string;
  readonly description: string;
  readonly type: string;
  readonly displaySymbol: string;
}

// ── Internal response shapes ──────────────────────────────────────────────────

interface FinnhubQuoteRaw {
  c?: number; // current price
  d?: number; // change
  dp?: number; // change percent
  h?: number; // high
  l?: number; // low
  o?: number; // open
  pc?: number; // previous close
  t?: number; // timestamp (unix seconds)
}

interface FinnhubCandleRaw {
  s?: string; // status ("ok" or "no_data")
  t?: number[];
  o?: number[];
  h?: number[];
  l?: number[];
  c?: number[];
  v?: number[];
}

interface FinnhubSearchRaw {
  count?: number;
  result?: Array<{
    symbol?: string;
    description?: string;
    type?: string;
    displaySymbol?: string;
  }>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ── Quote ─────────────────────────────────────────────────────────────────────

export async function fetchFinnhubQuote(
  symbol: string,
  apiKey: string,
): Promise<FinnhubQuoteResult> {
  const url = `${FINNHUB_BASE}/quote?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    headers: { "User-Agent": "CrossTide/1.0" },
  });

  if (!res.ok) {
    throw new FinnhubApiError(`Finnhub quote API returned ${res.status}`, res.status);
  }

  const json = (await res.json()) as FinnhubQuoteRaw;

  // Finnhub returns all zeros for unknown tickers instead of 404
  if (json.c === 0 && json.h === 0 && json.l === 0 && json.o === 0 && json.pc === 0) {
    throw new FinnhubApiError("Ticker not found on Finnhub", 404);
  }

  return {
    ticker: symbol.toUpperCase(),
    price: round2(json.c ?? 0),
    open: round2(json.o ?? 0),
    high: round2(json.h ?? 0),
    low: round2(json.l ?? 0),
    previousClose: round2(json.pc ?? 0),
    change: round2(json.d ?? 0),
    changePercent: round2(json.dp ?? 0),
    timestamp: (json.t ?? Math.floor(Date.now() / 1000)) * 1000,
    source: "finnhub",
  };
}

// ── Candles ───────────────────────────────────────────────────────────────────

/**
 * Map a range string to days for the Finnhub `from` parameter.
 */
function rangeToDays(range: string): number {
  const map: Record<string, number> = {
    "1d": 1,
    "5d": 5,
    "1mo": 30,
    "3mo": 90,
    "6mo": 180,
    "1y": 365,
    "2y": 730,
    "5y": 1825,
    max: 3650,
  };
  return map[range] ?? 365;
}

/**
 * Map a CrossTide interval to Finnhub resolution.
 * Finnhub resolutions: 1, 5, 15, 30, 60, D, W, M
 */
function intervalToResolution(interval: string): string {
  const map: Record<string, string> = {
    "1m": "1",
    "5m": "5",
    "15m": "15",
    "1h": "60",
    "1d": "D",
    "1wk": "W",
    "1mo": "M",
  };
  return map[interval] ?? "D";
}

export async function fetchFinnhubCandles(
  symbol: string,
  range: string,
  interval: string,
  apiKey: string,
): Promise<FinnhubChartResult> {
  const days = rangeToDays(range);
  const to = Math.floor(Date.now() / 1000);
  const from = to - days * 24 * 60 * 60;
  const resolution = intervalToResolution(interval);

  const url =
    `${FINNHUB_BASE}/stock/candle` +
    `?symbol=${encodeURIComponent(symbol)}` +
    `&resolution=${resolution}` +
    `&from=${from}` +
    `&to=${to}` +
    `&token=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    headers: { "User-Agent": "CrossTide/1.0" },
  });

  if (!res.ok) {
    throw new FinnhubApiError(`Finnhub candle API returned ${res.status}`, res.status);
  }

  const json = (await res.json()) as FinnhubCandleRaw;

  if (json.s !== "ok" || !json.t || !json.o || !json.h || !json.l || !json.c) {
    throw new FinnhubApiError("No candle data available from Finnhub", 404);
  }

  const candles: FinnhubCandle[] = [];
  for (let i = 0; i < json.t.length; i++) {
    const ts = json.t[i];
    const o = json.o[i];
    const h = json.h[i];
    const l = json.l[i];
    const c = json.c[i];
    if (ts == null || o == null || h == null || l == null || c == null) {
      continue;
    }
    candles.push({
      date: new Date(ts * 1000).toISOString().slice(0, 10),
      open: round2(o),
      high: round2(h),
      low: round2(l),
      close: round2(c),
      volume: json.v?.[i] ?? 0,
    });
  }

  return {
    ticker: symbol.toUpperCase(),
    candles,
    source: "finnhub",
  };
}

// ── Search ────────────────────────────────────────────────────────────────────

export async function fetchFinnhubSearch(
  query: string,
  apiKey: string,
  limit: number = 10,
): Promise<FinnhubSearchHit[]> {
  const url = `${FINNHUB_BASE}/search?q=${encodeURIComponent(query)}&token=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    headers: { "User-Agent": "CrossTide/1.0" },
  });

  if (!res.ok) {
    throw new FinnhubApiError(`Finnhub search API returned ${res.status}`, res.status);
  }

  const json = (await res.json()) as FinnhubSearchRaw;
  const results = json.result ?? [];

  return results.slice(0, limit).map((r) => ({
    symbol: r.symbol ?? "",
    description: r.description ?? "",
    type: r.type ?? "",
    displaySymbol: r.displaySymbol ?? r.symbol ?? "",
  }));
}
