/**
 * POST /api/screener
 *
 * Filters a list of tickers by technical criteria and returns consensus scores.
 *
 * Request body (JSON):
 *  {
 *    tickers: string[],      // required, 1–50 tickers
 *    minRsi?: number,        // 0–100, default 0
 *    maxRsi?: number,        // 0–100, default 100
 *    minAdx?: number,        // 0–100, default 0
 *    consensus?: "BUY" | "SELL" | "NEUTRAL"
 *  }
 *
 * Response:
 *  { rows: ScreenerRow[] }
 *
 * Values are deterministically seeded per ticker so the API is stable across
 * deployments without external data. In production, replace with real indicators
 * computed from live or cached candle data.
 */

export interface ScreenerParams {
  tickers: string[];
  minRsi?: number;
  maxRsi?: number;
  minAdx?: number;
  consensus?: "BUY" | "SELL" | "NEUTRAL";
  /** Maximum trailing P/E ratio. */
  maxPe?: number;
  /** Minimum trailing P/E ratio. */
  minPe?: number;
  /** Minimum market cap in USD. */
  minMarketCap?: number;
  /** Maximum market cap in USD. */
  maxMarketCap?: number;
  /** Minimum trailing dividend yield as decimal (0.02 = 2%). */
  minDividendYield?: number;
  /** Minimum profit margin as decimal. */
  minProfitMargin?: number;
}

export interface ScreenerRow {
  ticker: string;
  consensus: string;
  rsi: number;
  adx: number;
  score: number;
  /** Synthetic trailing P/E (placeholder until real fundamentals wired). */
  pe: number;
  /** Synthetic market cap in USD billions. */
  marketCapB: number;
  /** Synthetic dividend yield as decimal. */
  dividendYield: number;
  /** Synthetic profit margin as decimal. */
  profitMargin: number;
}

export interface ScreenerResponse {
  rows: ScreenerRow[];
}

const CONSENSUS_OPTIONS = ["BUY", "HOLD", "SELL", "NEUTRAL"] as const;

/** Deterministic hash to a float 0–1. */
function pseudoRand(seed: string, salt: number): number {
  let h = 0xdeadbeef ^ salt;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 0x9e3779b9);
    h ^= h >>> 16;
  }
  return (h >>> 0) / 0xffffffff;
}

function syntheticRow(ticker: string): ScreenerRow {
  const rsi = Math.round(pseudoRand(ticker, 1) * 80 + 10); // 10–90
  const adx = Math.round(pseudoRand(ticker, 2) * 60 + 10); // 10–70
  const score = Math.round(pseudoRand(ticker, 3) * 100);
  const cIdx = Math.floor(pseudoRand(ticker, 4) * CONSENSUS_OPTIONS.length);
  const consensus = CONSENSUS_OPTIONS[cIdx] ?? "NEUTRAL";
  const pe = Math.round(pseudoRand(ticker, 5) * 45 + 5); // 5–50
  const marketCapB = Math.round(pseudoRand(ticker, 6) * 2000 + 1); // 1–2001 B
  const dividendYield = Math.round(pseudoRand(ticker, 7) * 600) / 10000; // 0–0.06
  const profitMargin = Math.round(pseudoRand(ticker, 8) * 400 - 50) / 1000; // -0.05–0.35
  return { ticker, consensus, rsi, adx, score, pe, marketCapB, dividendYield, profitMargin };
}

export async function handleScreener(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (typeof body !== "object" || body === null || !("tickers" in body)) {
    return new Response(JSON.stringify({ error: "Missing required field: tickers" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const params = body as ScreenerParams;

  if (!Array.isArray(params.tickers) || params.tickers.length === 0) {
    return new Response(JSON.stringify({ error: "tickers must be a non-empty array" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (params.tickers.length > 50) {
    return new Response(JSON.stringify({ error: "Maximum 50 tickers per request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const minRsi = params.minRsi ?? 0;
  const maxRsi = params.maxRsi ?? 100;
  const minAdx = params.minAdx ?? 0;

  const rows = params.tickers
    .map((t) => syntheticRow(String(t).toUpperCase().slice(0, 12)))
    .filter((row) => {
      if (row.rsi < minRsi || row.rsi > maxRsi) return false;
      if (row.adx < minAdx) return false;
      if (params.consensus && row.consensus !== params.consensus) return false;
      // Fundamental filters
      if (params.maxPe !== undefined && row.pe > params.maxPe) return false;
      if (params.minPe !== undefined && row.pe < params.minPe) return false;
      if (params.minMarketCap !== undefined && row.marketCapB * 1e9 < params.minMarketCap)
        return false;
      if (params.maxMarketCap !== undefined && row.marketCapB * 1e9 > params.maxMarketCap)
        return false;
      if (params.minDividendYield !== undefined && row.dividendYield < params.minDividendYield)
        return false;
      if (params.minProfitMargin !== undefined && row.profitMargin < params.minProfitMargin)
        return false;
      return true;
    });

  const responseBody: ScreenerResponse = { rows };
  return new Response(JSON.stringify(responseBody), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
