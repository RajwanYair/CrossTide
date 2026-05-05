/**
 * Trend Strength Composite (TSC) — unified 0-100 trend strength score.
 *
 * Combines:
 * 1. ADX component: Measures trend intensity (0-100 scaled contribution)
 * 2. Price/MA alignment: How far price is from a key moving average
 * 3. Directional consistency: Ratio of up-days over lookback window
 *
 * A single composite score makes it easy to filter or rank assets by trend
 * strength without manually checking multiple separate indicators.
 *
 * Pure function: no I/O, no DOM, no Date.now().
 */
import type { DailyCandle } from "../types/domain";

export interface TrendStrengthPoint {
  readonly date: string;
  /** Composite trend strength: 0 = no trend, 100 = maximum trend. */
  readonly strength: number;
  /** Trend direction: 1 = bullish, -1 = bearish, 0 = neutral. */
  readonly direction: 1 | -1 | 0;
}

export interface TrendStrengthOptions {
  /**
   * ADX computation period.
   * @default 14
   */
  readonly adxPeriod?: number;
  /**
   * Moving average period for alignment component.
   * @default 20
   */
  readonly maPeriod?: number;
  /**
   * Lookback for directional consistency.
   * @default 14
   */
  readonly consistencyPeriod?: number;
}

/**
 * Compute trend strength composite series.
 *
 * @param candles  Daily OHLCV series (ascending date).
 * @param options  Period configuration.
 * @returns Array of trend strength points, or null if insufficient data.
 */
export function computeTrendStrength(
  candles: readonly DailyCandle[],
  options?: TrendStrengthOptions,
): TrendStrengthPoint[] | null {
  const adxPeriod = options?.adxPeriod ?? 14;
  const maPeriod = options?.maPeriod ?? 20;
  const consistencyPeriod = options?.consistencyPeriod ?? 14;

  // ADX requires 2*adxPeriod bars; overall we need enough for all components
  const minBars = Math.max(2 * adxPeriod, maPeriod, consistencyPeriod) + 1;
  if (candles.length < minBars) return null;

  // ── ADX calculation ──────────────────────────────────────────────────
  const adxValues = computeAdxSeries(candles, adxPeriod);

  // ── Moving average ───────────────────────────────────────────────────
  const maSeries = computeSmaSeries(candles, maPeriod);

  // ── Composite ────────────────────────────────────────────────────────
  const startIndex = minBars - 1;
  const result: TrendStrengthPoint[] = [];

  for (let i = startIndex; i < candles.length; i++) {
    // ADX component (0-100): raw ADX value capped at 60, scaled to 0-100
    const adx = adxValues[i] ?? 0;
    const adxComponent = Math.min(adx / 60, 1) * 100;

    // MA alignment component: distance from MA as % of MA, capped at ±10%
    const ma = maSeries[i] ?? candles[i]!.close;
    const maDistance = ma > 0 ? (candles[i]!.close - ma) / ma : 0;
    const maComponent = Math.min(Math.abs(maDistance) / 0.1, 1) * 100;

    // Directional consistency: fraction of up-close days in lookback
    let upDays = 0;
    for (let j = i - consistencyPeriod + 1; j <= i; j++) {
      if (j > 0 && candles[j]!.close > candles[j - 1]!.close) {
        upDays++;
      }
    }
    const upRatio = upDays / consistencyPeriod;
    // Convert to 0-100 where 0.5 = neutral. |ratio - 0.5| * 2 → 0-1
    const consistencyComponent = Math.abs(upRatio - 0.5) * 2 * 100;

    // Weighted composite (ADX 50%, alignment 30%, consistency 20%)
    const raw = adxComponent * 0.5 + maComponent * 0.3 + consistencyComponent * 0.2;
    const strength = Math.round(Math.min(raw, 100));

    // Direction from MA alignment + consistency
    let direction: 1 | -1 | 0 = 0;
    if (maDistance > 0.005 && upRatio > 0.5) direction = 1;
    else if (maDistance < -0.005 && upRatio < 0.5) direction = -1;

    result.push({ date: candles[i]!.date, strength, direction });
  }

  return result;
}

/** Compute ADX series using Wilder's smoothing. */
function computeAdxSeries(candles: readonly DailyCandle[], period: number): number[] {
  const n = candles.length;
  const adx: number[] = new Array(n).fill(0) as number[];

  if (n < 2 * period) return adx;

  // True Range, +DM, -DM
  const plusDm: number[] = [];
  const minusDm: number[] = [];
  const tr: number[] = [];

  for (let i = 1; i < n; i++) {
    const c = candles[i]!;
    const p = candles[i - 1]!;
    const upMove = c.high - p.high;
    const downMove = p.low - c.low;
    plusDm.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDm.push(downMove > upMove && downMove > 0 ? downMove : 0);
    tr.push(Math.max(c.high - c.low, Math.abs(c.high - p.close), Math.abs(c.low - p.close)));
  }

  // Wilder smoothed sums
  let smoothPlusDm = 0;
  let smoothMinusDm = 0;
  let smoothTr = 0;

  for (let i = 0; i < period; i++) {
    smoothPlusDm += plusDm[i]!;
    smoothMinusDm += minusDm[i]!;
    smoothTr += tr[i]!;
  }

  const dxValues: number[] = [];

  const calcDx = (): number => {
    const plusDi = smoothTr > 0 ? (smoothPlusDm / smoothTr) * 100 : 0;
    const minusDi = smoothTr > 0 ? (smoothMinusDm / smoothTr) * 100 : 0;
    const diSum = plusDi + minusDi;
    return diSum > 0 ? (Math.abs(plusDi - minusDi) / diSum) * 100 : 0;
  };

  dxValues.push(calcDx());

  for (let i = period; i < tr.length; i++) {
    smoothPlusDm = smoothPlusDm - smoothPlusDm / period + plusDm[i]!;
    smoothMinusDm = smoothMinusDm - smoothMinusDm / period + minusDm[i]!;
    smoothTr = smoothTr - smoothTr / period + tr[i]!;
    dxValues.push(calcDx());
  }

  // ADX = smoothed DX over 'period' window
  if (dxValues.length < period) return adx;

  let adxSmoothed = 0;
  for (let i = 0; i < period; i++) {
    adxSmoothed += dxValues[i]!;
  }
  adxSmoothed /= period;

  adx[2 * period - 1] = adxSmoothed;

  for (let i = period; i < dxValues.length; i++) {
    adxSmoothed = (adxSmoothed * (period - 1) + dxValues[i]!) / period;
    adx[i + period] = adxSmoothed;
  }

  return adx;
}

/** Compute simple moving average series. */
function computeSmaSeries(candles: readonly DailyCandle[], period: number): number[] {
  const n = candles.length;
  const sma: number[] = new Array(n).fill(0) as number[];

  if (n < period) return sma;

  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += candles[i]!.close;
  }
  sma[period - 1] = sum / period;

  for (let i = period; i < n; i++) {
    sum += candles[i]!.close - candles[i - period]!.close;
    sma[i] = sum / period;
  }

  return sma;
}
