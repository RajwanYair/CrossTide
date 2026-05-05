/**
 * Risk-Adjusted Return Comparison — compare multiple assets on
 * Sharpe, Sortino, Calmar, and max drawdown metrics side-by-side.
 *
 * Pure function — no I/O, no Date.now(). Accepts DailyCandle arrays.
 *
 * @module domain/risk-adjusted-comparison
 */

import type { DailyCandle } from "../types/domain";

export interface AssetRiskMetrics {
  readonly symbol: string;
  readonly totalReturn: number;
  readonly annualizedReturn: number;
  readonly annualizedVol: number;
  readonly sharpe: number;
  readonly sortino: number;
  readonly calmar: number;
  readonly maxDrawdown: number;
  readonly maxDrawdownPercent: number;
}

export interface RiskComparisonResult {
  readonly assets: readonly AssetRiskMetrics[];
  /** Rank of each asset by Sharpe ratio (1 = best). */
  readonly sharpeRanking: readonly string[];
  /** Rank of each asset by Sortino ratio (1 = best). */
  readonly sortinoRanking: readonly string[];
}

const TRADING_DAYS_PER_YEAR = 252;

/**
 * Compare risk-adjusted returns for multiple assets.
 *
 * @param assets - Array of { symbol, candles } with at least 2 entries, each with ≥ 20 candles.
 * @param riskFreeRate - Annual risk-free rate (default 0.04 = 4%).
 * @returns Comparison or null if insufficient data.
 */
export function compareRiskAdjusted(
  assets: readonly { readonly symbol: string; readonly candles: readonly DailyCandle[] }[],
  riskFreeRate: number = 0.04,
): RiskComparisonResult | null {
  if (assets.length < 2) return null;

  const metrics: AssetRiskMetrics[] = [];

  for (const { symbol, candles } of assets) {
    if (candles.length < 20) return null;

    const returns = computeReturns(candles);
    if (returns.length === 0) return null;

    const totalReturn = candles[candles.length - 1]!.close / candles[0]!.close - 1;
    const annualizedReturn = (1 + totalReturn) ** (TRADING_DAYS_PER_YEAR / returns.length) - 1;

    const mean = returns.reduce((s, v) => s + v, 0) / returns.length;
    const variance = returns.reduce((s, v) => s + (v - mean) ** 2, 0) / (returns.length - 1);
    const dailyVol = Math.sqrt(variance);
    const annualizedVol = dailyVol * Math.sqrt(TRADING_DAYS_PER_YEAR);

    const dailyRf = riskFreeRate / TRADING_DAYS_PER_YEAR;
    const sharpe = annualizedVol > 0 ? (annualizedReturn - riskFreeRate) / annualizedVol : 0;

    // Sortino: only downside deviation
    const downsideReturns = returns.filter((r) => r < dailyRf);
    const downsideVariance =
      downsideReturns.length > 0
        ? downsideReturns.reduce((s, v) => s + (v - dailyRf) ** 2, 0) / downsideReturns.length
        : 0;
    const downsideVol = Math.sqrt(downsideVariance) * Math.sqrt(TRADING_DAYS_PER_YEAR);
    const sortino = downsideVol > 0 ? (annualizedReturn - riskFreeRate) / downsideVol : 0;

    // Max drawdown
    const { maxDd, maxDdPercent } = computeMaxDrawdown(candles);

    // Calmar = annualized return / |max drawdown %|
    const calmar = maxDdPercent > 0 ? annualizedReturn / maxDdPercent : 0;

    metrics.push({
      symbol,
      totalReturn: round6(totalReturn),
      annualizedReturn: round6(annualizedReturn),
      annualizedVol: round6(annualizedVol),
      sharpe: round6(sharpe),
      sortino: round6(sortino),
      calmar: round6(calmar),
      maxDrawdown: round6(maxDd),
      maxDrawdownPercent: round6(maxDdPercent),
    });
  }

  const sharpeRanking = [...metrics].sort((a, b) => b.sharpe - a.sharpe).map((m) => m.symbol);

  const sortinoRanking = [...metrics].sort((a, b) => b.sortino - a.sortino).map((m) => m.symbol);

  return { assets: metrics, sharpeRanking, sortinoRanking };
}

function computeReturns(candles: readonly DailyCandle[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1]!.close;
    if (prev > 0) {
      returns.push(candles[i]!.close / prev - 1);
    }
  }
  return returns;
}

function computeMaxDrawdown(candles: readonly DailyCandle[]): {
  maxDd: number;
  maxDdPercent: number;
} {
  let peak = candles[0]!.close;
  let maxDd = 0;
  let maxDdPercent = 0;

  for (const c of candles) {
    if (c.close > peak) peak = c.close;
    const dd = peak - c.close;
    const ddPct = peak > 0 ? dd / peak : 0;
    if (dd > maxDd) maxDd = dd;
    if (ddPct > maxDdPercent) maxDdPercent = ddPct;
  }

  return { maxDd, maxDdPercent };
}

function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}
