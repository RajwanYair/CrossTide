/**
 * Rolling Sharpe Ratio — compute Sharpe ratio over a sliding window.
 *
 * Useful for visualizing risk-adjusted return stability over time.
 * Pure function: no I/O, no DOM, no Date.now().
 */
import type { DailyCandle } from "../types/domain";

export interface RollingSharpePoint {
  readonly date: string;
  readonly value: number;
}

export interface RollingSharpeOptions {
  /**
   * Window size in trading days.
   * @default 60
   */
  readonly window?: number;
  /**
   * Annualized risk-free rate (e.g. 0.04 for 4%).
   * @default 0.04
   */
  readonly riskFreeRate?: number;
}

/**
 * Compute annualized Sharpe ratio over a rolling window.
 *
 * @param candles  Daily OHLCV series (must be sorted ascending by date).
 * @param options  Window size and risk-free rate.
 * @returns Array of { date, value } points starting from index = window.
 *          Returns null if insufficient data.
 */
export function computeRollingSharpe(
  candles: readonly DailyCandle[],
  options?: RollingSharpeOptions,
): RollingSharpePoint[] | null {
  const window = options?.window ?? 60;
  const annualRfr = options?.riskFreeRate ?? 0.04;
  const dailyRfr = annualRfr / 252;

  if (candles.length < window + 1) return null;

  // Pre-compute daily returns
  const returns: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1]!.close;
    const curr = candles[i]!.close;
    returns.push(prev > 0 ? (curr - prev) / prev : 0);
  }

  const result: RollingSharpePoint[] = [];

  for (let i = window - 1; i < returns.length; i++) {
    let sum = 0;
    for (let j = i - window + 1; j <= i; j++) {
      sum += returns[j]!;
    }
    const mean = sum / window;

    let varianceSum = 0;
    for (let j = i - window + 1; j <= i; j++) {
      varianceSum += (returns[j]! - mean) ** 2;
    }
    const std = Math.sqrt(varianceSum / (window - 1));

    const sharpe = std === 0 ? 0 : ((mean - dailyRfr) / std) * Math.sqrt(252);
    // The date corresponds to the candle at index i+1 (since returns[i] uses candles[i] and candles[i+1])
    const candle = candles[i + 1];
    if (candle) {
      result.push({ date: candle.date, value: Math.round(sharpe * 1000) / 1000 });
    }
  }

  return result;
}
