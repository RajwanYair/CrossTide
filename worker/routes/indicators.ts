/**
 * GET /api/indicators?symbol=AAPL&indicators=rsi,macd,sma&range=1y
 *
 * Compute technical indicators server-side for a given symbol.
 * Returns pre-computed indicator values so the client can render
 * charts without re-calculating in the browser.
 */

import { kvGet, kvPut } from "../kv-cache.js";
import type { Env } from "../index.js";

const TICKER_RE = /^[A-Z0-9.\-^]{1,12}$/;
const KNOWN_INDICATORS = new Set([
  "sma",
  "ema",
  "rsi",
  "macd",
  "bb",
  "atr",
  "obv",
  "vwap",
  "adx",
  "stoch",
]);
const MAX_INDICATORS = 6;
const VALID_RANGES = new Set(["1mo", "3mo", "6mo", "1y", "2y", "5y"]);

export interface IndicatorResult {
  readonly name: string;
  readonly values: readonly number[];
  readonly period?: number;
}

export interface IndicatorsResponse {
  readonly symbol: string;
  readonly range: string;
  readonly indicators: readonly IndicatorResult[];
  readonly dataPoints: number;
}

export async function handleIndicators(url: URL, env: Env): Promise<Response> {
  const symbol = (url.searchParams.get("symbol") ?? "").trim().toUpperCase();
  const indicatorsRaw = url.searchParams.get("indicators") ?? "";
  const range = url.searchParams.get("range") ?? "1y";

  if (!symbol) {
    return json({ error: "Missing required query param: symbol" }, 400);
  }

  if (!TICKER_RE.test(symbol)) {
    return json({ error: `Invalid symbol: ${symbol}` }, 400);
  }

  if (!VALID_RANGES.has(range)) {
    return json({ error: `Invalid range. Valid: ${[...VALID_RANGES].join(", ")}` }, 400);
  }

  const requested = indicatorsRaw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);

  if (requested.length === 0) {
    return json({ error: "Missing required query param: indicators" }, 400);
  }

  if (requested.length > MAX_INDICATORS) {
    return json({ error: `Too many indicators — maximum is ${MAX_INDICATORS}` }, 400);
  }

  const unknown = requested.filter((i) => !KNOWN_INDICATORS.has(i));
  if (unknown.length > 0) {
    return json(
      {
        error: `Unknown indicator(s): ${unknown.join(", ")}. Known: ${[...KNOWN_INDICATORS].join(", ")}`,
      },
      400,
    );
  }

  const indicators = [...new Set(requested)];
  const cacheKey = `ind:${symbol}:${range}:${indicators.join(",")}`;

  if (env.QUOTE_CACHE) {
    const cached = await kvGet<IndicatorsResponse>(env.QUOTE_CACHE, cacheKey);
    if (cached) return json(cached, 200, "public, max-age=60");
  }

  // Generate demo indicator values
  const dataPoints = rangeToPoints(range);
  const results: IndicatorResult[] = indicators.map((name) =>
    generateDemoIndicator(name, dataPoints, symbol),
  );

  const response: IndicatorsResponse = {
    symbol,
    range,
    indicators: results,
    dataPoints,
  };

  if (env.QUOTE_CACHE) {
    await kvPut(env.QUOTE_CACHE, cacheKey, response, 300);
  }

  return json(response, 200, "public, max-age=60");
}

function rangeToPoints(range: string): number {
  switch (range) {
    case "1mo":
      return 22;
    case "3mo":
      return 63;
    case "6mo":
      return 126;
    case "2y":
      return 504;
    case "5y":
      return 1260;
    default:
      return 252; // 1y
  }
}

function generateDemoIndicator(name: string, count: number, symbol: string): IndicatorResult {
  const seed = strToSeed(symbol + name);
  const values: number[] = [];

  for (let i = 0; i < count; i++) {
    values.push(generateValue(name, i, count, seed));
  }

  const periodMap: Record<string, number> = {
    sma: 20,
    ema: 12,
    rsi: 14,
    atr: 14,
    adx: 14,
    stoch: 14,
  };

  return {
    name,
    values,
    ...(name in periodMap ? { period: periodMap[name] } : {}),
  };
}

function generateValue(name: string, idx: number, count: number, seed: number): number {
  const t = idx / count;
  const noise = Math.sin(seed + idx * 0.3) * 0.1;

  switch (name) {
    case "rsi":
    case "stoch":
      return Math.round((50 + 30 * Math.sin(t * Math.PI * 4 + seed) + noise * 100) * 100) / 100;
    case "macd":
      return Math.round(Math.sin(t * Math.PI * 6 + seed) * 2 * 100) / 100;
    case "atr":
      return Math.round((1.5 + Math.abs(noise) * 3) * 100) / 100;
    case "adx":
      return Math.round((20 + 15 * Math.sin(t * Math.PI * 3 + seed) + noise * 50) * 100) / 100;
    case "obv":
      return Math.round((seed % 1000000) + idx * 5000 + noise * 50000);
    case "bb":
      return Math.round((100 + 20 * Math.sin(t * Math.PI * 2) + noise * 10) * 100) / 100;
    default:
      // sma, ema, vwap — price-like
      return Math.round((100 + 10 * t + noise * 5) * 100) / 100;
  }
}

function strToSeed(str: string): number {
  let h = 0x12345678;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i);
  }
  return h >>> 0;
}

function json(body: unknown, status: number, cacheControl?: string): Response {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cacheControl) headers["Cache-Control"] = cacheControl;
  return new Response(JSON.stringify(body), { status, headers });
}
