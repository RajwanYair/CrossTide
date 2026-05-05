/**
 * Relative Volume (RVOL) — compare current volume to historical average.
 *
 * RVOL > 1.5 typically indicates unusual activity (breakout potential).
 * RVOL < 0.5 indicates low participation (consolidation/low interest).
 *
 * Pure function: no I/O, no DOM, no Date.now().
 */
import type { DailyCandle } from "../types/domain";

export interface RvolPoint {
  readonly date: string;
  /** Relative volume ratio (current volume / average volume). */
  readonly rvol: number;
  /** Current bar volume. */
  readonly volume: number;
  /** Average volume over the lookback window. */
  readonly avgVolume: number;
}

export interface RvolOptions {
  /**
   * Lookback period for average volume calculation.
   * @default 20
   */
  readonly period?: number;
}

/**
 * Compute relative volume series.
 *
 * @param candles  Daily OHLCV series (sorted ascending by date).
 * @param options  Lookback period configuration.
 * @returns Array of RVOL points starting from index = period.
 *          Returns null if insufficient data.
 */
export function computeRelativeVolume(
  candles: readonly DailyCandle[],
  options?: RvolOptions,
): RvolPoint[] | null {
  const period = options?.period ?? 20;

  if (candles.length <= period) return null;

  const result: RvolPoint[] = [];
  let volumeSum = 0;

  // Initialize rolling sum for first window
  for (let i = 0; i < period; i++) {
    volumeSum += candles[i]!.volume;
  }

  for (let i = period; i < candles.length; i++) {
    const avgVolume = volumeSum / period;
    const candle = candles[i]!;
    const rvol = avgVolume > 0 ? candle.volume / avgVolume : 0;

    result.push({
      date: candle.date,
      rvol: Math.round(rvol * 1000) / 1000,
      volume: candle.volume,
      avgVolume: Math.round(avgVolume),
    });

    // Slide window: add current, remove oldest
    volumeSum += candle.volume;
    volumeSum -= candles[i - period]!.volume;
  }

  return result;
}

/**
 * Detect volume surge events (RVOL above threshold).
 *
 * @param candles  Daily OHLCV series.
 * @param threshold  RVOL threshold to qualify as a surge (default: 2.0 = 200% of avg).
 * @param options  Lookback period.
 * @returns Indices where RVOL exceeded the threshold.
 */
export function detectVolumeSurges(
  candles: readonly DailyCandle[],
  threshold = 2.0,
  options?: RvolOptions,
): number[] {
  const rvols = computeRelativeVolume(candles, options);
  if (!rvols) return [];

  const period = options?.period ?? 20;
  const surges: number[] = [];

  for (let i = 0; i < rvols.length; i++) {
    if (rvols[i]!.rvol >= threshold) {
      surges.push(i + period); // index in original candles array
    }
  }

  return surges;
}
