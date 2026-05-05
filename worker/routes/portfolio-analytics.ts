/**
 * /api/portfolio/analytics — Server-side portfolio analytics endpoint.
 *
 * Accepts a portfolio (holdings with symbol, shares, costBasis) via POST,
 * fetches current quotes, and returns allocation, P&L, and concentration metrics.
 */
import type { Env } from "../index.js";
import { kvGet, kvPut } from "../kv-cache.js";

const QUOTE_TTL = 300; // 5 min

interface Holding {
  readonly symbol: string;
  readonly shares: number;
  readonly costBasis: number;
}

interface HoldingAnalytics {
  readonly symbol: string;
  readonly shares: number;
  readonly costBasis: number;
  readonly currentPrice: number;
  readonly marketValue: number;
  readonly pnl: number;
  readonly pnlPercent: number;
  readonly weight: number; // allocation weight 0–1
}

interface PortfolioAnalyticsResponse {
  readonly holdings: readonly HoldingAnalytics[];
  readonly totalValue: number;
  readonly totalCost: number;
  readonly totalPnl: number;
  readonly totalPnlPercent: number;
  readonly herfindahlIndex: number; // concentration: 0 = diversified, 1 = single stock
}

export async function handlePortfolioAnalytics(request: Request, env: Env): Promise<Response> {
  let body: { holdings?: unknown };
  try {
    body = (await request.json()) as { holdings?: unknown };
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(body.holdings) || body.holdings.length === 0) {
    return Response.json({ error: "holdings array required" }, { status: 400 });
  }

  const holdings: Holding[] = [];
  for (const h of body.holdings as unknown[]) {
    if (
      typeof h !== "object" ||
      h === null ||
      typeof (h as Record<string, unknown>).symbol !== "string" ||
      typeof (h as Record<string, unknown>).shares !== "number" ||
      typeof (h as Record<string, unknown>).costBasis !== "number"
    ) {
      return Response.json({ error: "Invalid holding entry" }, { status: 400 });
    }
    const { symbol, shares, costBasis } = h as {
      symbol: string;
      shares: number;
      costBasis: number;
    };
    if (shares <= 0 || costBasis < 0 || symbol.length === 0 || symbol.length > 10) {
      return Response.json({ error: `Invalid data for ${String(symbol)}` }, { status: 400 });
    }
    holdings.push({ symbol: symbol.toUpperCase(), shares, costBasis });
  }

  // Fetch quotes for all symbols
  const symbols = holdings.map((h) => h.symbol);
  const prices = new Map<string, number>();

  try {
    // Try batch quote
    const cacheKey = `portfolio-quotes:${symbols.sort().join(",")}`;
    let cached: Record<string, number> | null = null;

    if (env.QUOTE_CACHE) {
      cached = await kvGet<Record<string, number>>(env.QUOTE_CACHE, cacheKey);
    }

    if (cached) {
      for (const [sym, price] of Object.entries(cached)) {
        prices.set(sym, price);
      }
    } else {
      const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols.join(","))}`;
      const res = await fetch(url, {
        headers: { "User-Agent": "CrossTide/1.0" },
      });

      if (!res.ok) {
        return Response.json({ error: "Failed to fetch quotes" }, { status: 502 });
      }

      const json = (await res.json()) as {
        quoteResponse?: {
          result?: Array<{ symbol?: string; regularMarketPrice?: number }>;
        };
      };

      for (const r of json.quoteResponse?.result ?? []) {
        if (typeof r.symbol === "string" && typeof r.regularMarketPrice === "number") {
          prices.set(r.symbol, r.regularMarketPrice);
        }
      }

      if (env.QUOTE_CACHE) {
        const priceObj = Object.fromEntries(prices);
        await kvPut(env.QUOTE_CACHE, cacheKey, priceObj, QUOTE_TTL);
      }
    }
  } catch {
    return Response.json({ error: "Quote fetch failed" }, { status: 502 });
  }

  // Compute analytics
  let totalValue = 0;
  let totalCost = 0;
  const holdingResults: HoldingAnalytics[] = [];

  for (const h of holdings) {
    const price = prices.get(h.symbol);
    if (price === undefined) {
      return Response.json({ error: `No quote found for ${h.symbol}` }, { status: 404 });
    }
    const marketValue = price * h.shares;
    const cost = h.costBasis * h.shares;
    totalValue += marketValue;
    totalCost += cost;
    holdingResults.push({
      symbol: h.symbol,
      shares: h.shares,
      costBasis: h.costBasis,
      currentPrice: price,
      marketValue,
      pnl: marketValue - cost,
      pnlPercent: cost > 0 ? (marketValue - cost) / cost : 0,
      weight: 0, // will be set below
    });
  }

  // Set weights and compute HHI
  let hhi = 0;
  const withWeights = holdingResults.map((h) => {
    const weight = totalValue > 0 ? h.marketValue / totalValue : 0;
    hhi += weight ** 2;
    return { ...h, weight: round6(weight) };
  });

  const response: PortfolioAnalyticsResponse = {
    holdings: withWeights.map((h) => ({
      ...h,
      pnl: round6(h.pnl),
      pnlPercent: round6(h.pnlPercent),
      marketValue: round6(h.marketValue),
    })),
    totalValue: round6(totalValue),
    totalCost: round6(totalCost),
    totalPnl: round6(totalValue - totalCost),
    totalPnlPercent: totalCost > 0 ? round6((totalValue - totalCost) / totalCost) : 0,
    herfindahlIndex: round6(hhi),
  };

  return Response.json(response);
}

function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}
