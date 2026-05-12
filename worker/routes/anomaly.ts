/**
 * GET /api/anomaly?ticker=AAPL&period=20&threshold=2
 *
 * Detects price and volume anomalies using z-score analysis.
 * Flags unusual price moves, volume spikes, and gap openings that
 * may indicate significant events worth investigating.
 *
 * Q23: Anomaly detection endpoint.
 */

import { fetchYahooChart } from "../providers/yahoo.js";
import { kvGet, kvPut } from "../kv-cache.js";
import type { Env } from "../index.js";

const TICKER_RE = /^[A-Z0-9.\-^]{1,12}$/;
const ANOMALY_CACHE_TTL = 300; // 5 minutes

export interface Anomaly {
  date: string;
  type: "price" | "volume" | "gap";
  zScore: number;
  value: number;
  mean: number;
  description: string;
}

export interface AnomalyResponse {
  ticker: string;
  period: number;
  threshold: number;
  anomalies: Anomaly[];
  summary: {
    totalDays: number;
    anomalyCount: number;
    latestClose: number;
    priceZScore: number;
    volumeZScore: number;
  };
  source: "live" | "cache";
}

function computeZScore(values: number[], index: number, period: number): number {
  if (index < period) return 0;
  const slice = values.slice(index - period, index);
  const mean = slice.reduce((s, v) => s + v, 0) / period;
  const variance = slice.reduce((s, v) => s + (v - mean) ** 2, 0) / period;
  const stdDev = Math.sqrt(variance);
  if (stdDev === 0) return 0;
  return (values[index]! - mean) / stdDev;
}

function sliceMean(values: number[], end: number, period: number): number {
  const slice = values.slice(Math.max(0, end - period), end);
  return slice.length > 0 ? slice.reduce((s, v) => s + v, 0) / slice.length : 0;
}

export async function handleAnomaly(url: URL, env: Env): Promise<Response> {
  const ticker = (url.searchParams.get("ticker") ?? "").toUpperCase();
  if (!ticker || !TICKER_RE.test(ticker)) {
    return json({ error: "Invalid or missing ticker" }, 400);
  }

  const period = Math.min(
    Math.max(parseInt(url.searchParams.get("period") ?? "20", 10) || 20, 5),
    100,
  );
  const threshold = Math.min(
    Math.max(parseFloat(url.searchParams.get("threshold") ?? "2") || 2, 1),
    5,
  );

  // Check cache
  const cacheKey = `anomaly:${ticker}:${period}:${threshold}`;
  if (env.QUOTE_CACHE) {
    const cached = await kvGet<AnomalyResponse>(env.QUOTE_CACHE, cacheKey);
    if (cached) {
      return json({ ...cached, source: "cache" as const }, 200, "public, max-age=60");
    }
  }

  // Fetch 6 months of daily data for sufficient lookback
  let candles: {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];
  try {
    const chart = await fetchYahooChart(ticker, "6mo", "1d");
    candles = chart.candles;
  } catch {
    return json({ error: `Unable to fetch chart data for ${ticker}` }, 502);
  }

  if (candles.length < period + 1) {
    return json(
      { error: `Insufficient data: need at least ${period + 1} days, got ${candles.length}` },
      422,
    );
  }

  const closes = candles.map((c) => c.close);
  const volumes = candles.map((c) => c.volume);
  const anomalies: Anomaly[] = [];

  for (let i = period; i < candles.length; i++) {
    const candle = candles[i]!;

    // Price return z-score
    const prevClose = closes[i - 1]!;
    const dailyReturn = prevClose > 0 ? (closes[i]! - prevClose) / prevClose : 0;
    const returns: number[] = [];
    for (let j = Math.max(1, i - period); j <= i; j++) {
      const prev = closes[j - 1]!;
      if (prev > 0) returns.push((closes[j]! - prev) / prev);
    }
    const returnMean = returns.reduce((s, r) => s + r, 0) / returns.length;
    const returnStd = Math.sqrt(
      returns.reduce((s, r) => s + (r - returnMean) ** 2, 0) / returns.length,
    );
    const priceZ = returnStd > 0 ? (dailyReturn - returnMean) / returnStd : 0;

    if (Math.abs(priceZ) >= threshold) {
      anomalies.push({
        date: candle.date,
        type: "price",
        zScore: Math.round(priceZ * 100) / 100,
        value: closes[i]!,
        mean: sliceMean(closes, i, period),
        description: `${priceZ > 0 ? "unusual gain" : "unusual drop"} of ${(dailyReturn * 100).toFixed(1)}%`,
      });
    }

    // Volume z-score
    const volZ = computeZScore(volumes, i, period);
    if (Math.abs(volZ) >= threshold) {
      anomalies.push({
        date: candle.date,
        type: "volume",
        zScore: Math.round(volZ * 100) / 100,
        value: volumes[i]!,
        mean: sliceMean(volumes, i, period),
        description: `volume ${volZ > 0 ? "spike" : "drought"} at ${(volumes[i]! / 1_000_000).toFixed(1)}M`,
      });
    }

    // Gap detection (open vs previous close)
    if (prevClose > 0) {
      const gapPct = (candle.open - prevClose) / prevClose;
      if (Math.abs(gapPct) >= 0.02) {
        anomalies.push({
          date: candle.date,
          type: "gap",
          zScore: Math.round(gapPct * 100 * 100) / 100,
          value: candle.open,
          mean: prevClose,
          description: `${gapPct > 0 ? "gap up" : "gap down"} of ${(gapPct * 100).toFixed(1)}%`,
        });
      }
    }
  }

  // Sort by recency (most recent first)
  anomalies.reverse();

  // Compute summary
  const latestPriceZ =
    closes.length >= period ? computeZScore(closes, closes.length - 1, period) : 0;
  const latestVolZ =
    volumes.length >= period ? computeZScore(volumes, volumes.length - 1, period) : 0;

  const body: AnomalyResponse = {
    ticker,
    period,
    threshold,
    anomalies: anomalies.slice(0, 50), // Limit to 50 most recent
    summary: {
      totalDays: candles.length,
      anomalyCount: anomalies.length,
      latestClose: closes[closes.length - 1]!,
      priceZScore: Math.round(latestPriceZ * 100) / 100,
      volumeZScore: Math.round(latestVolZ * 100) / 100,
    },
    source: "live",
  };

  if (env.QUOTE_CACHE) {
    await kvPut(env.QUOTE_CACHE, cacheKey, body, ANOMALY_CACHE_TTL);
  }

  return json(body, 200, "public, max-age=60");
}

function json(body: unknown, status: number, cacheControl?: string): Response {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cacheControl) headers["Cache-Control"] = cacheControl;
  return new Response(JSON.stringify(body), { status, headers });
}
