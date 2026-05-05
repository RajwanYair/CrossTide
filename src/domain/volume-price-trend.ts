/**
 * Volume-Price Trend (VPT) — cumulative volume-weighted price momentum.
 *
 * VPT measures the relationship between volume and price direction.
 * Unlike OBV which adds/subtracts entire volume, VPT weights volume
 * by the percentage price change, giving a more proportional reading.
 *
 * VPT = Previous VPT + Volume × ((Close - Previous Close) / Previous Close)
 *
 * Rising VPT confirms uptrend with volume support.
 * Falling VPT suggests distribution despite price holding.
 * Divergences signal potential reversals.
 *
 * Pure function: no I/O, no DOM, no Date.now().
 */
import type { DailyCandle } from "../types/domain";

export interface VptPoint {
  readonly date: string;
  /** Cumulative VPT value. */
  readonly vpt: number;
  /** Signal line (EMA of VPT). */
  readonly signal: number;
}

export interface VptOptions {
  /**
   * Signal line EMA period.
   * @default 14
   */
  readonly signalPeriod?: number;
}

/**
 * Compute Volume-Price Trend series with signal line.
 *
 * @param candles  Daily OHLCV series (ascending by date), minimum 2 bars.
 * @param options  Signal line configuration.
 * @returns Array of VPT points, or null if insufficient data.
 */
export function computeVpt(
  candles: readonly DailyCandle[],
  options?: VptOptions,
): VptPoint[] | null {
  if (candles.length < 2) return null;

  const signalPeriod = options?.signalPeriod ?? 14;

  // Build raw VPT series
  const vptValues: number[] = [0]; // VPT starts at 0
  let cumulative = 0;

  for (let i = 1; i < candles.length; i++) {
    const prevClose = candles[i - 1]!.close;
    if (prevClose === 0) {
      vptValues.push(cumulative);
      continue;
    }
    const priceChange = (candles[i]!.close - prevClose) / prevClose;
    cumulative += candles[i]!.volume * priceChange;
    vptValues.push(cumulative);
  }

  // Compute EMA signal line
  const multiplier = 2 / (signalPeriod + 1);
  const signals: number[] = [];

  // Seed EMA with SMA of first signalPeriod values
  const seedEnd = Math.min(signalPeriod, vptValues.length);
  let ema = 0;
  for (let i = 0; i < seedEnd; i++) {
    ema += vptValues[i]!;
  }
  ema /= seedEnd;

  for (let i = 0; i < vptValues.length; i++) {
    if (i < seedEnd) {
      // During seed period, compute running SMA
      let sum = 0;
      for (let j = 0; j <= i; j++) {
        sum += vptValues[j]!;
      }
      signals.push(sum / (i + 1));
    } else {
      ema = (vptValues[i]! - ema) * multiplier + ema;
      signals.push(ema);
    }
  }

  // Build result (skip first bar since VPT starts at bar 1)
  const result: VptPoint[] = [];
  for (let i = 1; i < candles.length; i++) {
    result.push({
      date: candles[i]!.date,
      vpt: Math.round(vptValues[i]! * 100) / 100,
      signal: Math.round(signals[i]! * 100) / 100,
    });
  }

  return result;
}
