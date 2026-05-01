/**
 * Elder Ray (Alexander Elder, 1989). Measures bull/bear pressure
 * relative to an EMA of close:
 *   bullPower = high - EMA(close, period)
 *   bearPower = low  - EMA(close, period)
 * Default period = 13.
 */

import type { Candle } from "./heikin-ashi";

export interface ElderRayPoint {
  readonly time: number;
  readonly bullPower: number;
  readonly bearPower: number;
}

const ema = (values: readonly number[], period: number): (number | null)[] => {
  if (period <= 0 || values.length === 0) return [];
  const k = 2 / (period + 1);
  const out: (number | null)[] = new Array(values.length).fill(null);
  let seed = 0;
  for (let i = 0; i < period && i < values.length; i++) seed += values[i]!;
  if (values.length < period) return out;
  let prev = seed / period;
  out[period - 1] = prev;
  for (let i = period; i < values.length; i++) {
    prev = values[i]! * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
};

export function computeElderRay(candles: readonly Candle[], period = 13): ElderRayPoint[] {
  if (candles.length < period) return [];
  const closes = candles.map((c) => c.close);
  const emaClose = ema(closes, period);
  const out: ElderRayPoint[] = [];
  for (let i = 0; i < candles.length; i++) {
    const e = emaClose[i];
    if (e === null || e === undefined) continue;
    out.push({
      time: candles[i]!.time,
      bullPower: candles[i]!.high - e,
      bearPower: candles[i]!.low - e,
    });
  }
  return out;
}
