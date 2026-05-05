/**
 * Time-Segmented Volume (TSV) — Worden Brothers accumulation/distribution.
 *
 * TSV compares the current close to a past close (lookback period)
 * and multiplies by volume. It reveals whether buying or selling pressure
 * dominates over a given timeframe. Positive TSV = accumulation,
 * negative = distribution.
 *
 * TSV(i) = Volume(i) × (Close(i) - Close(i - lookback))
 *
 * The signal line is a moving average of TSV for crossover signals.
 *
 * Pure function: no I/O, no DOM, no Date.now().
 */
import type { DailyCandle } from "../types/domain";

export interface TsvPoint {
  readonly date: string;
  /** Raw TSV value. */
  readonly tsv: number;
  /** Signal line (SMA of TSV). */
  readonly signal: number;
}

export interface TsvOptions {
  /**
   * Price comparison lookback period.
   * @default 13
   */
  readonly lookback?: number;
  /**
   * Signal line moving average period.
   * @default 7
   */
  readonly signalPeriod?: number;
}

/**
 * Compute Time-Segmented Volume series.
 *
 * @param candles  Daily OHLCV series (ascending by date).
 * @param options  Period configuration.
 * @returns Array of TSV points, or null if insufficient data.
 */
export function computeTsv(
  candles: readonly DailyCandle[],
  options?: TsvOptions,
): TsvPoint[] | null {
  const lookback = options?.lookback ?? 13;
  const signalPeriod = options?.signalPeriod ?? 7;
  const minBars = lookback + signalPeriod;

  if (candles.length < minBars) return null;

  // Compute raw TSV values starting from index = lookback
  const tsvRaw: Array<{ date: string; value: number }> = [];

  for (let i = lookback; i < candles.length; i++) {
    const priceChange = candles[i]!.close - candles[i - lookback]!.close;
    tsvRaw.push({
      date: candles[i]!.date,
      value: candles[i]!.volume * priceChange,
    });
  }

  // Compute signal line (SMA of TSV)
  const result: TsvPoint[] = [];
  let runningSum = 0;

  for (let i = 0; i < tsvRaw.length; i++) {
    runningSum += tsvRaw[i]!.value;

    if (i >= signalPeriod) {
      runningSum -= tsvRaw[i - signalPeriod]!.value;
    }

    const count = Math.min(i + 1, signalPeriod);
    const signal = runningSum / count;

    result.push({
      date: tsvRaw[i]!.date,
      tsv: Math.round(tsvRaw[i]!.value * 100) / 100,
      signal: Math.round(signal * 100) / 100,
    });
  }

  return result;
}
