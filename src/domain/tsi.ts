/**
 * True Strength Index (William Blau, 1991). Double-smoothed momentum
 * oscillator:
 *   m       = close[i] - close[i-1]
 *   absm    = |m|
 *   ema1    = EMA(m, slow)
 *   ema2    = EMA(ema1, fast)
 *   absEma1 = EMA(absm, slow)
 *   absEma2 = EMA(absEma1, fast)
 *   TSI     = 100 * ema2 / absEma2
 *   signal  = EMA(TSI, signalPeriod)   (default 7)
 * Output is bounded in [-100, 100].
 */

export interface TsiOptions {
  readonly slow?: number;
  readonly fast?: number;
  readonly signal?: number;
}

export interface TsiPoint {
  readonly index: number;
  readonly tsi: number;
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

const emaOfNullableTail = (
  values: readonly (number | null)[],
  period: number,
): (number | null)[] => {
  const out: (number | null)[] = new Array(values.length).fill(null);
  let firstIdx = -1;
  for (let i = 0; i < values.length; i++) {
    if (values[i] !== null) {
      firstIdx = i;
      break;
    }
  }
  if (firstIdx < 0) return out;
  const dense: number[] = [];
  for (let i = firstIdx; i < values.length; i++) dense.push(values[i] as number);
  const ed = ema(dense, period);
  for (let j = 0; j < ed.length; j++) out[firstIdx + j] = ed[j] ?? null;
  return out;
};

export function computeTsi(closes: readonly number[], options: TsiOptions = {}): TsiPoint[] {
  const slow = options.slow ?? 25;
  const fast = options.fast ?? 13;
  const sig = options.signal ?? 7;
  if (slow <= 0 || fast <= 0 || sig <= 0) return [];
  if (closes.length < 2) return [];

  const m: number[] = new Array(closes.length - 1);
  const absm: number[] = new Array(closes.length - 1);
  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i]! - closes[i - 1]!;
    m[i - 1] = diff;
    absm[i - 1] = Math.abs(diff);
  }
  const ema1 = ema(m, slow);
  const absEma1 = ema(absm, slow);
  const ema2 = emaOfNullableTail(ema1, fast);
  const absEma2 = emaOfNullableTail(absEma1, fast);

  // Map back to closes-aligned indices: m[k] corresponds to close index k+1.
  const tsi: (number | null)[] = new Array(closes.length).fill(null);
  for (let k = 0; k < m.length; k++) {
    const a = ema2[k];
    const b = absEma2[k];
    if (a === null || a === undefined || b === null || b === undefined || b === 0) continue;
    tsi[k + 1] = (100 * a) / b;
  }
  const signal = emaOfNullableTail(tsi, sig);

  const out: TsiPoint[] = [];
  for (let i = 0; i < closes.length; i++) {
    const v = tsi[i];
    if (v === null || v === undefined) continue;
    out.push({ index: i, tsi: v, signal: signal[i] ?? null });
  }
  return out;
}
