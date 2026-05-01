/**
 * DEMA / TEMA — Patrick Mulloy (1994). Reduce EMA lag.
 *   DEMA = 2*EMA  - EMA(EMA)
 *   TEMA = 3*EMA  - 3*EMA(EMA) + EMA(EMA(EMA))
 */

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

const emaOfDefined = (series: readonly (number | null)[], period: number): (number | null)[] => {
  const out: (number | null)[] = new Array(series.length).fill(null);
  // Slice off leading nulls, run EMA on the dense tail.
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

export function computeDema(values: readonly number[], period = 20): (number | null)[] {
  if (period <= 0) return values.map(() => null);
  const e1 = ema(values, period);
  const e2 = emaOfDefined(e1, period);
  return values.map((_, i) => {
    const a = e1[i];
    const b = e2[i];
    if (a === null || a === undefined || b === null || b === undefined) return null;
    return 2 * a - b;
  });
}

export function computeTema(values: readonly number[], period = 20): (number | null)[] {
  if (period <= 0) return values.map(() => null);
  const e1 = ema(values, period);
  const e2 = emaOfDefined(e1, period);
  const e3 = emaOfDefined(e2, period);
  return values.map((_, i) => {
    const a = e1[i];
    const b = e2[i];
    const c = e3[i];
    if (
      a === null ||
      a === undefined ||
      b === null ||
      b === undefined ||
      c === null ||
      c === undefined
    )
      return null;
    return 3 * a - 3 * b + c;
  });
}
