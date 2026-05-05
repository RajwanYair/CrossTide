/**
 * Omega Ratio — probability-weighted ratio of gains vs losses.
 *
 * Unlike Sharpe/Sortino which assume normal returns, Omega captures the
 * ENTIRE return distribution. It is the ratio of the area above the threshold
 * (gains) to the area below the threshold (losses) in the cumulative
 * return distribution.
 *
 * Omega > 1 = positive expectation at the given threshold.
 * Omega = 1 = break-even.
 * Omega < 1 = negative expectation.
 *
 * Pure function: no I/O, no DOM, no Date.now().
 */
import type { DailyCandle } from "../types/domain";

export interface OmegaResult {
  /** The omega ratio value. */
  readonly omega: number;
  /** Sum of excess returns above threshold. */
  readonly totalGain: number;
  /** Sum of shortfall below threshold (absolute value). */
  readonly totalLoss: number;
  /** Number of return observations used. */
  readonly observations: number;
}

export interface OmegaOptions {
  /**
   * Return threshold (daily). Returns above this are "gains", below are "losses".
   * @default 0 (break-even threshold)
   */
  readonly threshold?: number;
}

/**
 * Compute the Omega ratio from daily candle data.
 *
 * @param candles  Daily OHLCV series (ascending by date), minimum 2 bars.
 * @param options  Threshold configuration.
 * @returns Omega result, or null if insufficient data.
 */
export function computeOmega(
  candles: readonly DailyCandle[],
  options?: OmegaOptions,
): OmegaResult | null {
  if (candles.length < 2) return null;

  const threshold = options?.threshold ?? 0;

  let totalGain = 0;
  let totalLoss = 0;

  for (let i = 1; i < candles.length; i++) {
    const prevClose = candles[i - 1]!.close;
    if (prevClose === 0) continue;
    const dailyReturn = (candles[i]!.close - prevClose) / prevClose;
    const excess = dailyReturn - threshold;

    if (excess > 0) {
      totalGain += excess;
    } else {
      totalLoss += Math.abs(excess);
    }
  }

  const omega = totalLoss === 0 ? (totalGain > 0 ? Infinity : 1) : totalGain / totalLoss;

  return {
    omega: Math.round(omega * 10000) / 10000,
    totalGain: Math.round(totalGain * 100000) / 100000,
    totalLoss: Math.round(totalLoss * 100000) / 100000,
    observations: candles.length - 1,
  };
}

/**
 * Compute Omega ratio from raw return series (for portfolio analytics).
 *
 * @param returns  Array of period returns (e.g. daily returns).
 * @param threshold  Return threshold (default 0).
 * @returns Omega ratio value, or null if insufficient data.
 */
export function omegaFromReturns(returns: readonly number[], threshold = 0): number | null {
  if (returns.length === 0) return null;

  let totalGain = 0;
  let totalLoss = 0;

  for (const r of returns) {
    const excess = r - threshold;
    if (excess > 0) {
      totalGain += excess;
    } else {
      totalLoss += Math.abs(excess);
    }
  }

  if (totalLoss === 0) return totalGain > 0 ? Infinity : 1;
  return totalGain / totalLoss;
}
