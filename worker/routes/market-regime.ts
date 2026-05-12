/**
 * GET /api/regime?ticker=AAPL
 *
 * Returns current market regime classification using multiple signals:
 *   - VIX level (from FRED provider)
 *   - Price trend (from chart data)
 *   - Realized volatility (from chart data)
 *
 * Q22: Market regime detection endpoint.
 */

import {
  classifyVix,
  trendRegime,
  volatilityRegime,
  combinedRegime,
  regimeLabel,
  regimeColor,
  regimeScore,
} from "../domain/market-regime.js";
import type { RegimeSignal, Regime } from "../domain/market-regime.js";
import { fetchYahooChart } from "../providers/yahoo.js";
import { fetchFredSeries } from "../providers/fred.js";
import { kvGet, kvPut } from "../kv-cache.js";
import type { Env } from "../index.js";

const TICKER_RE = /^[A-Z0-9.\-^]{1,12}$/;
const REGIME_CACHE_TTL = 300; // 5 minutes

export interface RegimeResponse {
  ticker: string;
  regime: Regime;
  label: string;
  color: string;
  score: number;
  signals: RegimeSignal[];
  source: "live" | "cache";
}

export async function handleRegime(url: URL, env: Env): Promise<Response> {
  const ticker = (url.searchParams.get("ticker") ?? "").toUpperCase();
  if (!ticker || !TICKER_RE.test(ticker)) {
    return json({ error: "Invalid or missing ticker" }, 400);
  }

  // Check cache
  const cacheKey = `regime:${ticker}`;
  if (env.QUOTE_CACHE) {
    const cached = await kvGet<RegimeResponse>(env.QUOTE_CACHE, cacheKey);
    if (cached) {
      return json({ ...cached, source: "cache" as const }, 200, "public, max-age=60");
    }
  }

  const signals: RegimeSignal[] = [];

  // ── Signal 1: VIX level ───────────────────────────────────────────────
  try {
    const fredResult = await fetchFredSeries("VIXCLS", env.FRED_KEY);
    const latestObs = fredResult.observations.filter((o) => o.value !== null).at(-1);

    if (latestObs?.value != null) {
      signals.push({
        source: "vix",
        regime: classifyVix(latestObs.value),
        confidence: 0.9,
      });
    }
  } catch {
    // VIX unavailable — continue with other signals
  }

  // ── Signal 2 & 3: Price trend + realized volatility ───────────────────
  try {
    const chart = await fetchYahooChart(ticker, "3mo", "1d");
    const closes = chart.candles.map((c) => c.close);

    if (closes.length >= 20) {
      // Trend signal
      signals.push({
        source: "trend",
        regime: trendRegime(closes, 50),
        confidence: 0.7,
      });

      // Realized vol signal
      const returns: number[] = [];
      for (let i = 1; i < closes.length; i++) {
        const prev = closes[i - 1]!;
        const curr = closes[i]!;
        if (prev > 0) {
          returns.push((curr - prev) / prev);
        }
      }
      if (returns.length >= 10) {
        signals.push({
          source: "volatility",
          regime: volatilityRegime(returns),
          confidence: 0.6,
        });
      }
    }
  } catch {
    // Chart unavailable — continue with available signals
  }

  // ── Combine signals ───────────────────────────────────────────────────
  if (signals.length === 0) {
    return json({ error: "Unable to determine regime: no data available" }, 503);
  }

  const regime = combinedRegime(signals);
  const body: RegimeResponse = {
    ticker,
    regime,
    label: regimeLabel(regime),
    color: regimeColor(regime),
    score: regimeScore(signals),
    signals,
    source: "live",
  };

  // Cache the result
  if (env.QUOTE_CACHE) {
    await kvPut(env.QUOTE_CACHE, cacheKey, body, REGIME_CACHE_TTL);
  }

  return json(body, 200, "public, max-age=60");
}

function json(body: unknown, status: number, cacheControl?: string): Response {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cacheControl) headers["Cache-Control"] = cacheControl;
  return new Response(JSON.stringify(body), { status, headers });
}
