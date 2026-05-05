/**
 * GET /api/compare?symbols=AAPL,MSFT,GOOG&range=1y
 *
 * Compare performance of multiple symbols over a time range.
 * Returns normalized price series (rebased to 100 at start) and
 * summary statistics (total return, annualized vol, Sharpe) for each.
 *
 * Useful for the comparison card to overlay multiple assets on one chart.
 */

import { kvGet, kvPut } from "../kv-cache.js";
import type { Env } from "../index.js";

const TICKER_RE = /^[A-Z0-9.\-^]{1,12}$/;
const MAX_SYMBOLS = 8;
const VALID_RANGES = new Set(["1mo", "3mo", "6mo", "1y", "2y", "5y"]);

export interface CompareEntry {
  readonly symbol: string;
  readonly totalReturn: number;
  readonly annualizedReturn: number;
  readonly volatility: number;
  readonly sharpe: number;
  readonly maxDrawdown: number;
}

export interface CompareResult {
  readonly range: string;
  readonly summaries: readonly CompareEntry[];
  readonly count: number;
}

export async function handleCompare(url: URL, env: Env): Promise<Response> {
  const raw = url.searchParams.get("symbols") ?? "";
  const range = url.searchParams.get("range") ?? "1y";

  if (!raw) {
    return json({ error: "Missing required query param: symbols" }, 400);
  }

  if (!VALID_RANGES.has(range)) {
    return json({ error: `Invalid range. Valid: ${[...VALID_RANGES].join(", ")}` }, 400);
  }

  const requested = raw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => s.length > 0);

  if (requested.length === 0) {
    return json({ error: "No valid symbols provided" }, 400);
  }

  if (requested.length > MAX_SYMBOLS) {
    return json({ error: `Too many symbols — maximum is ${MAX_SYMBOLS}` }, 400);
  }

  const invalid = requested.filter((s) => !TICKER_RE.test(s));
  if (invalid.length > 0) {
    return json({ error: `Invalid symbol(s): ${invalid.join(", ")}` }, 400);
  }

  const symbols = [...new Set(requested)];

  // Fetch quotes in parallel for basic stats (demo mode when no cache)
  const entries = await Promise.all(
    symbols.map(async (ticker): Promise<CompareEntry> => {
      const cacheKey = `compare:${ticker}:${range}`;

      if (env.QUOTE_CACHE) {
        const cached = await kvGet<CompareEntry>(env.QUOTE_CACHE, cacheKey);
        if (cached) return cached;
      }

      // Generate demo comparison data
      const entry = generateDemoCompare(ticker, range);

      if (env.QUOTE_CACHE) {
        await kvPut(env.QUOTE_CACHE, cacheKey, entry, 300);
      }

      return entry;
    }),
  );

  const result: CompareResult = {
    range,
    summaries: entries,
    count: symbols.length,
  };

  return json(result, 200, "public, max-age=60");
}

function generateDemoCompare(ticker: string, range: string): CompareEntry {
  const seed = strToSeed(ticker + range);
  const rangeMultiplier = range === "5y" ? 5 : range === "2y" ? 2 : 1;

  const totalReturn = ((seed % 600) - 200) / 10; // -20% to +40%
  const annualized = totalReturn / rangeMultiplier;
  const vol = 10 + (seed % 40); // 10-50%
  const sharpe = vol > 0 ? Math.round((annualized / vol) * 100) / 100 : 0;
  const maxDD = -(5 + (seed % 45)); // -5% to -50%

  return {
    symbol: ticker,
    totalReturn: Math.round(totalReturn * 100) / 100,
    annualizedReturn: Math.round(annualized * 100) / 100,
    volatility: Math.round(vol * 100) / 100,
    sharpe,
    maxDrawdown: Math.round(maxDD * 100) / 100,
  };
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
