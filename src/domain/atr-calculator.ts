/**
 * ATR Calculator — Average True Range.
 * Ported from Dart: lib/src/domain/atr_calculator.dart
 *
 * TR = max(high-low, |high-prevClose|, |low-prevClose|)
 * ATR = Wilder smoothing: ATR[t] = (ATR[t-1] * (period-1) + TR[t]) / period
 */
import type { DailyCandle } from "../types/domain";
import { DEFAULTS } from "./technical-defaults";

export interface AtrPoint {
  readonly date: string;
  readonly atr: number;
  readonly atrPercent: number;
}

function trueRange(candle: DailyCandle, prevClose: number): number {
  const hl = candle.high - candle.low;
  const hc = Math.abs(candle.high - prevClose);
  const lc = Math.abs(candle.low - prevClose);
  return Math.max(hl, hc, lc);
}

export function computeAtrSeries(
  candles: readonly DailyCandle[],
  period: number = DEFAULTS.period,
): AtrPoint[] {
  if (candles.length <= period) return [];

  let sumTr = 0;
  for (let i = 1; i <= period; i++) {
    const candle = candles[i];
    const prev = candles[i - 1];
    if (candle && prev) sumTr += trueRange(candle, prev.close);
  }
  let atr = sumTr / period;

  const results: AtrPoint[] = [];
  const seed = candles[period];
  if (seed) {
    results.push({
      date: seed.date,
      atr,
      atrPercent: seed.close > 0 ? (atr / seed.close) * 100 : 0,
    });
  }

  for (let i = period + 1; i < candles.length; i++) {
    const candle = candles[i];
    const prev = candles[i - 1];
    if (!candle || !prev) continue;
    const tr = trueRange(candle, prev.close);
    atr = (atr * (period - 1) + tr) / period;
    results.push({
      date: candle.date,
      atr,
      atrPercent: candle.close > 0 ? (atr / candle.close) * 100 : 0,
    });
  }
  return results;
}

export function computeAtr(
  candles: readonly DailyCandle[],
  period = DEFAULTS.period,
): number | null {
  const series = computeAtrSeries(candles, period);
  const last = series[series.length - 1];
  return last?.atr ?? null;
}
