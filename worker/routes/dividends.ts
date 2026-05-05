/**
 * /api/dividends/:symbol — Historical dividend data endpoint.
 *
 * Returns dividend payment history (ex-date, amount) from Yahoo Finance.
 * Caches in KV with 24-hour TTL (dividends change infrequently).
 */
import type { Env } from "../index.js";
import { kvGet, kvPut } from "../kv-cache.js";

const DIVIDENDS_TTL = 86400; // 24 hours

interface DividendEvent {
  readonly date: string;
  readonly amount: number;
}

interface DividendsResponse {
  readonly symbol: string;
  readonly dividends: readonly DividendEvent[];
  readonly count: number;
  readonly source: string;
}

export async function handleDividends(symbol: string, env: Env): Promise<Response> {
  const sym = symbol.toUpperCase();

  if (!/^[A-Z0-9.^=-]{1,20}$/.test(sym)) {
    return Response.json({ error: "Invalid symbol" }, { status: 400 });
  }

  const cacheKey = `dividends:${sym}`;

  if (env.QUOTE_CACHE) {
    const cached = await kvGet<DividendsResponse>(env.QUOTE_CACHE, cacheKey);
    if (cached) {
      return Response.json({ ...cached, source: "cache" });
    }
  }

  try {
    // Yahoo Finance v8 chart API returns dividend events in the "events" field
    const now = Math.floor(Date.now() / 1000);
    const tenYearsAgo = now - 10 * 365 * 86400;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?period1=${tenYearsAgo}&period2=${now}&interval=1mo&events=div`;

    const res = await fetch(url, {
      headers: { "User-Agent": "CrossTide/1.0" },
    });

    if (!res.ok) {
      return Response.json({ error: "Upstream provider error" }, { status: 502 });
    }

    const json = (await res.json()) as {
      chart?: {
        result?: Array<{
          events?: {
            dividends?: Record<string, { date?: number; amount?: number }>;
          };
        }>;
      };
    };

    const raw = json.chart?.result?.[0]?.events?.dividends ?? {};

    const dividends: DividendEvent[] = Object.values(raw)
      .filter(
        (d): d is { date: number; amount: number } =>
          typeof d.date === "number" && typeof d.amount === "number" && d.amount > 0,
      )
      .map((d) => ({
        date: new Date(d.date * 1000).toISOString().slice(0, 10),
        amount: Math.round(d.amount * 1e6) / 1e6,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const data: DividendsResponse = {
      symbol: sym,
      dividends,
      count: dividends.length,
      source: "yahoo",
    };

    if (env.QUOTE_CACHE) {
      await kvPut(env.QUOTE_CACHE, cacheKey, data, DIVIDENDS_TTL);
    }

    return Response.json(data);
  } catch {
    return Response.json({ error: "Failed to fetch dividend data" }, { status: 502 });
  }
}
