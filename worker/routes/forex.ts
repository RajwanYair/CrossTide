/**
 * /api/forex/:pair — Foreign exchange quote endpoint.
 *
 * Returns exchange rate, bid/ask, and daily change for a forex pair
 * from Yahoo Finance. Caches in KV with 2-minute TTL.
 *
 * Pairs use format: EURUSD, GBPJPY, etc. Yahoo requires "=X" suffix.
 */
import type { Env } from "../index.js";
import { kvGet, kvPut } from "../kv-cache.js";

const FOREX_TTL = 120; // 2 minutes
const PAIR_RE = /^[A-Z]{6}$/;

interface ForexQuote {
  readonly pair: string;
  readonly from: string;
  readonly to: string;
  readonly rate: number;
  readonly bid: number;
  readonly ask: number;
  readonly change: number;
  readonly changePercent: number;
  readonly dayHigh: number;
  readonly dayLow: number;
  readonly previousClose: number;
  readonly timestamp: number;
  readonly source: string;
}

export async function handleForex(pair: string, env: Env): Promise<Response> {
  const p = pair.toUpperCase();

  if (!PAIR_RE.test(p)) {
    return Response.json(
      { error: "Invalid pair format. Use 6 letters, e.g. EURUSD" },
      { status: 400 },
    );
  }

  const from = p.slice(0, 3);
  const to = p.slice(3, 6);
  const yahooSymbol = `${p}=X`;
  const cacheKey = `forex:${p}`;

  if (env.QUOTE_CACHE) {
    const cached = await kvGet<ForexQuote>(env.QUOTE_CACHE, cacheKey);
    if (cached) {
      return Response.json({ ...cached, source: "cache" });
    }
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=2d`;

    const res = await fetch(url, {
      headers: { "User-Agent": "CrossTide/1.0" },
    });

    if (!res.ok) {
      return Response.json({ error: "Upstream provider error" }, { status: 502 });
    }

    const json = (await res.json()) as {
      chart?: {
        result?: Array<{
          meta?: {
            regularMarketPrice?: number;
            previousClose?: number;
            bid?: number;
            ask?: number;
            regularMarketDayHigh?: number;
            regularMarketDayLow?: number;
            regularMarketTime?: number;
          };
        }>;
      };
    };

    const meta = json.chart?.result?.[0]?.meta;
    if (!meta || typeof meta.regularMarketPrice !== "number") {
      return Response.json({ error: "No data available for this pair" }, { status: 404 });
    }

    const rate = meta.regularMarketPrice;
    const previousClose = meta.previousClose ?? rate;
    const change = rate - previousClose;
    const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

    const data: ForexQuote = {
      pair: p,
      from,
      to,
      rate,
      bid: meta.bid ?? rate,
      ask: meta.ask ?? rate,
      change: Math.round(change * 1e6) / 1e6,
      changePercent: Math.round(changePercent * 1e4) / 1e4,
      dayHigh: meta.regularMarketDayHigh ?? rate,
      dayLow: meta.regularMarketDayLow ?? rate,
      previousClose,
      timestamp: (meta.regularMarketTime ?? 0) * 1000,
      source: "yahoo",
    };

    if (env.QUOTE_CACHE) {
      await kvPut(env.QUOTE_CACHE, cacheKey, data, FOREX_TTL);
    }

    return Response.json(data);
  } catch {
    return Response.json({ error: "Failed to fetch forex data" }, { status: 502 });
  }
}
