/**
 * Percentage Price Oscillator (Gerald Appel). Same logic as MACD but
 * expressed as a percentage of the slow EMA, so values are comparable
 * across instruments with different price scales.
 *   PPO       = 100 * (EMA_fast - EMA_slow) / EMA_slow
 *   signal    = EMA(PPO, signalPeriod)
 *   histogram = PPO - signal
 */

export interface PpoPoint {
  readonly index: number;
  readonly ppo: number;
  readonly signal: number | null;
  readonly histogram: number | null;
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

export function computePpo(
  closes: readonly number[],
  fast = 12,
  slow = 26,
  signalPeriod = 9,
): PpoPoint[] {
  if (fast <= 0 || slow <= 0 || signalPeriod <= 0) return [];
  if (closes.length < slow) return [];
  const eFast = ema(closes, fast);
  const eSlow = ema(closes, slow);
  const ppoSeries: (number | null)[] = closes.map((_, i) => {
    const f = eFast[i];
    const s = eSlow[i];
    if (f === null || f === undefined || s === null || s === undefined || s === 0) return null;
    return (100 * (f - s)) / s;
  });
  // Signal EMA over the dense tail of ppoSeries
  let firstIdx = -1;
  for (let i = 0; i < ppoSeries.length; i++) {
    if (ppoSeries[i] !== null) {
      firstIdx = i;
      break;
    }
  }
  const signal: (number | null)[] = new Array(closes.length).fill(null);
  if (firstIdx >= 0) {
    const dense: number[] = [];
    for (let i = firstIdx; i < ppoSeries.length; i++) dense.push(ppoSeries[i] as number);
    const sigDense = ema(dense, signalPeriod);
    for (let j = 0; j < sigDense.length; j++) signal[firstIdx + j] = sigDense[j] ?? null;
  }
  const out: PpoPoint[] = [];
  for (let i = 0; i < closes.length; i++) {
    const p = ppoSeries[i];
    if (p === null || p === undefined) continue;
    const s = signal[i];
    out.push({
      index: i,
      ppo: p,
      signal: s ?? null,
      histogram: s === null || s === undefined ? null : p - s,
    });
  }
  return out;
}
