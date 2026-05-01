/**
 * TRIX (Jack Hutson, 1980s): rate of change of a triple-smoothed EMA.
 *   ema1 = EMA(close, period)
 *   ema2 = EMA(ema1,  period)
 *   ema3 = EMA(ema2,  period)
 *   trix = 100 * (ema3[t] - ema3[t-1]) / ema3[t-1]
 * A signal line is an EMA of TRIX.
 */

import type { Candle } from "./heikin-ashi";

export interface TrixPoint {
  readonly time: number;
  readonly trix: number;
  readonly signal: number | null;
}

const ema = (values: readonly number[], period: number): (number | null)[] => {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (period <= 0 || values.length < period) return out;
  const k = 2 / (period + 1);
  let seed = 0;
  for (let i = 0; i < period; i++) seed += values[i]!;
  let prev = seed / period;
  out[period - 1] = prev;
  for (let i = period; i < values.length; i++) {
    prev = values[i]! * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
};

const emaOfDefined = (
  series: readonly (number | null)[],
  period: number,
): (number | null)[] => {
  const out: (number | null)[] = new Array(series.length).fill(null);
  let firstIdx = -1;
  for (let i = 0; i < series.length; i++) {
    if (series[i] !== null) {
      firstIdx = i;
      break;
    }
  }
  if (firstIdx < 0) return out;
  const dense: number[] = [];
  for (let i = firstIdx; i < series.length; i++) dense.push(series[i] as number);
  const e = ema(dense, period);
  for (let j = 0; j < e.length; j++) out[firstIdx + j] = e[j] ?? null;
  return out;
};

export function computeTrix(
  candles: readonly Candle[],
  period = 15,
  signalPeriod = 9,
): TrixPoint[] {
  if (period <= 0 || candles.length < period * 3) return [];
  const closes = candles.map((c) => c.close);
  const e1 = ema(closes, period);
  const e2 = emaOfDefined(e1, period);
  const e3 = emaOfDefined(e2, period);

  const trixSeries: (number | null)[] = new Array(candles.length).fill(null);
  for (let i = 1; i < candles.length; i++) {
    const cur = e3[i];
    const prev = e3[i - 1];
    if (cur === null || prev === null || cur === undefined || prev === undefined || prev === 0) continue;
    trixSeries[i] = (100 * (cur - prev)) / prev;
  }
  // Signal line: EMA of trix where defined.
  const trixVals: number[] = [];
  const trixIdx: number[] = [];
  for (let i = 0; i < trixSeries.length; i++) {
    const v = trixSeries[i];
    if (v !== null && v !== undefined) {
      trixVals.push(v);
      trixIdx.push(i);
    }
  }
  const sig = ema(trixVals, signalPeriod);
  const signalAt = new Array<number | null>(candles.length).fill(null);
  for (let j = 0; j < trixIdx.length; j++) {
    signalAt[trixIdx[j]!] = sig[j] ?? null;
  }

  const out: TrixPoint[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (trixSeries[i] === null) continue;
    out.push({
      time: candles[i]!.time,
      trix: trixSeries[i]!,
      signal: signalAt[i] ?? null,
    });
  }
  return out;
}
