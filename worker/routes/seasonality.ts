/**
 * GET /api/seasonality/:symbol — Seasonal return patterns endpoint.
 *
 * Computes monthly and day-of-week seasonality from historical price data.
 * Uses Yahoo Finance chart data with 5-year range. KV cached 24h.
 */
import type { Env } from "../index.js";
import { kvGet, kvPut } from "../kv-cache.js";
import { fetchYahooChart } from "../providers/yahoo.js";

const SEASONALITY_TTL = 86_400; // 24 hours — seasonal data rarely changes
const SYMBOL_RE = /^[A-Z0-9.^=-]{1,20}$/;

interface DailyReturn {
  readonly time: number;
  readonly returnFraction: number;
}

interface SeasonalityBucket {
  readonly key: number;
  readonly label: string;
  readonly count: number;
  readonly meanReturn: number;
  readonly winRate: number;
}

interface SeasonalityResponse {
  readonly symbol: string;
  readonly byMonth: SeasonalityBucket[];
  readonly byDayOfWeek: SeasonalityBucket[];
  readonly totalDays: number;
  readonly source: string;
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function computeReturns(
  candles: readonly { readonly date: string; readonly close: number }[],
): DailyReturn[] {
  const returns: DailyReturn[] = [];
  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1]!;
    const curr = candles[i]!;
    if (prev.close !== 0) {
      returns.push({
        time: new Date(curr.date).getTime(),
        returnFraction: (curr.close - prev.close) / prev.close,
      });
    }
  }
  return returns;
}

function aggregate(
  groups: Map<number, number[]>,
  labelOf: (k: number) => string,
): SeasonalityBucket[] {
  const out: SeasonalityBucket[] = [];
  const keys = [...groups.keys()].sort((a, b) => a - b);
  for (const k of keys) {
    const rs = groups.get(k)!;
    if (rs.length === 0) continue;
    const sum = rs.reduce((s, r) => s + r, 0);
    const wins = rs.filter((r) => r > 0).length;
    out.push({
      key: k,
      label: labelOf(k),
      count: rs.length,
      meanReturn: sum / rs.length,
      winRate: wins / rs.length,
    });
  }
  return out;
}

function byMonth(returns: readonly DailyReturn[]): SeasonalityBucket[] {
  const groups = new Map<number, number[]>();
  for (const r of returns) {
    const m = new Date(r.time).getUTCMonth();
    const arr = groups.get(m) ?? [];
    arr.push(r.returnFraction);
    groups.set(m, arr);
  }
  return aggregate(groups, (k) => MONTH_LABELS[k] ?? String(k));
}

function byDayOfWeek(returns: readonly DailyReturn[]): SeasonalityBucket[] {
  const groups = new Map<number, number[]>();
  for (const r of returns) {
    const d = new Date(r.time).getUTCDay();
    const arr = groups.get(d) ?? [];
    arr.push(r.returnFraction);
    groups.set(d, arr);
  }
  return aggregate(groups, (k) => DOW_LABELS[k] ?? String(k));
}

export async function handleSeasonality(symbol: string, env: Env): Promise<Response> {
  const sym = symbol.toUpperCase();

  if (!SYMBOL_RE.test(sym)) {
    return Response.json({ error: "Invalid symbol format" }, { status: 400 });
  }

  const cacheKey = `seasonality:${sym}`;

  if (env.QUOTE_CACHE) {
    const cached = await kvGet<SeasonalityResponse>(env.QUOTE_CACHE, cacheKey);
    if (cached) {
      return Response.json({ ...cached, source: "cache" });
    }
  }

  try {
    const raw = await fetchYahooChart(sym, "5y", "1d");
    const candles = raw.candles;

    if (candles.length < 2) {
      return Response.json(
        { error: "Insufficient historical data for seasonality analysis" },
        { status: 404 },
      );
    }

    const returns = computeReturns(candles);
    const result: SeasonalityResponse = {
      symbol: sym,
      byMonth: byMonth(returns),
      byDayOfWeek: byDayOfWeek(returns),
      totalDays: returns.length,
      source: "yahoo",
    };

    if (env.QUOTE_CACHE) {
      void kvPut(env.QUOTE_CACHE, cacheKey, result, SEASONALITY_TTL);
    }

    return Response.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json(
      { error: `Failed to fetch seasonality data: ${message}` },
      { status: 502 },
    );
  }
}
