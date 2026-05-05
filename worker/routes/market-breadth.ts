/**
 * POST /api/market-breadth — Market breadth analysis endpoint.
 *
 * Accepts an array of symbols, fetches current quotes for each,
 * and computes breadth statistics (advance/decline, signal distribution).
 * KV cached per symbol set for 5 minutes.
 */
import type { Env } from "../index.js";
import { kvGet, kvPut } from "../kv-cache.js";
import { fetchYahooQuote } from "../providers/yahoo.js";

const BREADTH_TTL = 300; // 5 minutes
const SYMBOL_RE = /^[A-Z0-9.^=-]{1,20}$/;
const MAX_SYMBOLS = 50;

interface BreadthTicker {
  readonly ticker: string;
  readonly price: number;
  readonly changePercent: number;
  readonly advancer: boolean;
  readonly decliner: boolean;
}

interface BreadthResponse {
  readonly total: number;
  readonly advancers: number;
  readonly decliners: number;
  readonly unchanged: number;
  readonly adRatio: number | null;
  readonly avgChangePercent: number;
  readonly tickers: readonly BreadthTicker[];
  readonly source: string;
}

export async function handleMarketBreadth(request: Request, env: Env): Promise<Response> {
  let body: { symbols?: unknown; changeThreshold?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(body.symbols) || body.symbols.length === 0) {
    return Response.json({ error: "symbols array required" }, { status: 400 });
  }

  if (body.symbols.length > MAX_SYMBOLS) {
    return Response.json({ error: `Maximum ${MAX_SYMBOLS} symbols allowed` }, { status: 400 });
  }

  const symbols: string[] = [];
  for (const s of body.symbols as unknown[]) {
    if (typeof s !== "string") {
      return Response.json({ error: "Each symbol must be a string" }, { status: 400 });
    }
    const upper = s.toUpperCase();
    if (!SYMBOL_RE.test(upper)) {
      return Response.json({ error: `Invalid symbol: ${s}` }, { status: 400 });
    }
    symbols.push(upper);
  }

  const changeThreshold =
    typeof body.changeThreshold === "number" && body.changeThreshold >= 0
      ? body.changeThreshold
      : 0.05;

  const cacheKey = `breadth:${symbols.sort().join(",")}`;

  if (env.QUOTE_CACHE) {
    const cached = await kvGet<BreadthResponse>(env.QUOTE_CACHE, cacheKey);
    if (cached) {
      return Response.json({ ...cached, source: "cache" });
    }
  }

  const tickers: BreadthTicker[] = [];
  const errors: string[] = [];

  const results = await Promise.allSettled(
    symbols.map(async (sym) => {
      const quote = await fetchYahooQuote(sym);
      return {
        ticker: sym,
        price: quote.price,
        changePercent: quote.changePercent,
      };
    }),
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      const t = result.value;
      tickers.push({
        ticker: t.ticker,
        price: t.price,
        changePercent: t.changePercent,
        advancer: t.changePercent > changeThreshold,
        decliner: t.changePercent < -changeThreshold,
      });
    } else {
      errors.push(result.reason instanceof Error ? result.reason.message : "Unknown error");
    }
  }

  if (tickers.length === 0) {
    return Response.json(
      { error: "Failed to fetch quotes for all symbols", details: errors },
      { status: 502 },
    );
  }

  const advancers = tickers.filter((t) => t.advancer).length;
  const decliners = tickers.filter((t) => t.decliner).length;
  const unchanged = tickers.length - advancers - decliners;
  const avgChangePercent =
    tickers.length > 0 ? tickers.reduce((s, t) => s + t.changePercent, 0) / tickers.length : 0;

  const response: BreadthResponse = {
    total: tickers.length,
    advancers,
    decliners,
    unchanged,
    adRatio: decliners > 0 ? advancers / decliners : null,
    avgChangePercent: Number(avgChangePercent.toFixed(4)),
    tickers: [...tickers].sort((a, b) => b.changePercent - a.changePercent),
    source: "yahoo",
  };

  if (env.QUOTE_CACHE) {
    void kvPut(env.QUOTE_CACHE, cacheKey, response, BREADTH_TTL);
  }

  return Response.json(response);
}
