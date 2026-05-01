/**
 * GET /api/chart?ticker=AAPL&range=1y&interval=1d
 *
 * Returns OHLCV candlestick data for the given ticker.
 *
 * In production this would proxy to Yahoo Finance / Twelve Data. For now it
 * returns deterministically seeded synthetic candles so clients can develop
 * against a stable shape without external API keys.
 *
 * Query params:
 *  ticker   — required, 1–12 chars, uppercase
 *  range    — "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y" | "2y" | "5y" | "max"  (default "1y")
 *  interval — "1m" | "5m" | "15m" | "1h" | "1d" | "1wk" | "1mo"  (default "1d")
 */

const RANGE_DAYS: Record<string, number> = {
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

/** Mulberry32 PRNG — deterministic, seedable. */
function mulberry32(seed: number): () => number {
  let s = seed;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Convert a string to a numeric seed. */
function strToSeed(str: string): number {
  let h = 0x12345678;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i);
  }
  return h >>> 0;
}

export interface CandleRecord {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ChartResponse {
  ticker: string;
  currency: string;
  candles: CandleRecord[];
}

function generateCandles(ticker: string, days: number): CandleRecord[] {
  const rand = mulberry32(strToSeed(ticker));
  const candles: CandleRecord[] = [];
  let price = 100 + rand() * 400; // starting price 100–500

  const now = new Date();
  // Only add trading days (Mon–Fri)
  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue; // skip weekends

    const change = (rand() - 0.48) * price * 0.03;
    const open = Math.max(1, price);
    const close = Math.max(1, price + change);
    const high = Math.max(open, close) * (1 + rand() * 0.015);
    const low = Math.min(open, close) * (1 - rand() * 0.015);
    const volume = Math.round(1_000_000 + rand() * 50_000_000);

    candles.push({
      date: d.toISOString().slice(0, 10),
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume,
    });

    price = close;
  }
  return candles;
}

const VALID_RANGES = new Set(Object.keys(RANGE_DAYS));
const TICKER_RE = /^[A-Z0-9.\-^]{1,12}$/;

export function handleChart(url: URL): Response {
  const ticker = (url.searchParams.get("ticker") ?? "").toUpperCase();
  if (!ticker || !TICKER_RE.test(ticker)) {
    return new Response(JSON.stringify({ error: "Invalid or missing ticker" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const range = url.searchParams.get("range") ?? "1y";
  if (!VALID_RANGES.has(range)) {
    return new Response(
      JSON.stringify({ error: `Invalid range. Valid: ${[...VALID_RANGES].join(", ")}` }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const days = RANGE_DAYS[range] ?? 365;
  const candles = generateCandles(ticker, days);

  const body: ChartResponse = { ticker, currency: "USD", candles };
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300", // 5-minute cache
    },
  });
}
