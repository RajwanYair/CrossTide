/**
 * Volatility-Adjusted Momentum (VAM) — momentum normalized by ATR.
 *
 * Standard momentum (ROC) doesn't account for volatility, making cross-asset
 * comparison unreliable. VAM divides price change by ATR to produce a
 * volatility-normalized momentum reading.
 *
 * High VAM = strong trend relative to volatility (breakout)
 * Low VAM = price change within normal volatility range
 *
 * Pure function: no I/O, no DOM, no Date.now().
 */
import type { DailyCandle } from "../types/domain";

export interface VamPoint {
  readonly date: string;
  /** Volatility-adjusted momentum value. */
  readonly value: number;
}

export interface VamOptions {
  /**
   * Momentum lookback period (rate-of-change window).
   * @default 14
   */
  readonly momentumPeriod?: number;
  /**
   * ATR period for volatility normalization.
   * @default 14
   */
  readonly atrPeriod?: number;
}

/**
 * Compute volatility-adjusted momentum series.
 *
 * VAM = (Close - Close[n]) / ATR(n)
 *
 * @param candles  Daily OHLCV series (sorted ascending by date).
 * @param options  Period configuration.
 * @returns Array of VAM points, or null if insufficient data.
 */
export function computeVam(
  candles: readonly DailyCandle[],
  options?: VamOptions,
): VamPoint[] | null {
  const momPeriod = options?.momentumPeriod ?? 14;
  const atrPeriod = options?.atrPeriod ?? 14;
  const minBars = Math.max(momPeriod, atrPeriod) + 1;

  if (candles.length < minBars) return null;

  // Compute True Range series
  const tr: number[] = [candles[0]!.high - candles[0]!.low];
  for (let i = 1; i < candles.length; i++) {
    const c = candles[i]!;
    const prevClose = candles[i - 1]!.close;
    tr.push(Math.max(c.high - c.low, Math.abs(c.high - prevClose), Math.abs(c.low - prevClose)));
  }

  // Compute initial ATR as SMA of first atrPeriod TRs
  let atr = 0;
  for (let i = 0; i < atrPeriod; i++) {
    atr += tr[i]!;
  }
  atr /= atrPeriod;

  // We need ATR[i] for i >= atrPeriod-1, and momentum requires i >= momPeriod
  const startIndex = Math.max(momPeriod, atrPeriod);
  const atrValues: number[] = new Array(candles.length).fill(0) as number[];
  atrValues[atrPeriod - 1] = atr;

  // Build full ATR series using Wilder's smoothing
  for (let i = atrPeriod; i < candles.length; i++) {
    atr = (atr * (atrPeriod - 1) + tr[i]!) / atrPeriod;
    atrValues[i] = atr;
  }

  const result: VamPoint[] = [];

  for (let i = startIndex; i < candles.length; i++) {
    const currentClose = candles[i]!.close;
    const pastClose = candles[i - momPeriod]!.close;
    const currentAtr = atrValues[i]!;

    const vam = currentAtr > 0 ? (currentClose - pastClose) / currentAtr : 0;

    result.push({
      date: candles[i]!.date,
      value: Math.round(vam * 1000) / 1000,
    });
  }

  return result;
}
