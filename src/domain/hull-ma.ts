/**
 * Hull Moving Average — Alan Hull (2005). Smooth + responsive:
 *   HMA(n) = WMA( 2*WMA(n/2) - WMA(n), sqrt(n) )
 */

const wma = (values: readonly number[], period: number): (number | null)[] => {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (period <= 0 || values.length < period) return out;
  const denom = (period * (period + 1)) / 2;
  for (let i = period - 1; i < values.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += values[i - period + 1 + j]! * (j + 1);
    }
    out[i] = sum / denom;
  }
  return out;
};

export function computeHullMA(values: readonly number[], period = 16): (number | null)[] {
  if (period <= 1) return values.map(() => null);
  const half = Math.max(1, Math.floor(period / 2));
  const sqrtP = Math.max(1, Math.floor(Math.sqrt(period)));
  const wmaHalf = wma(values, half);
  const wmaFull = wma(values, period);
  const diff: (number | null)[] = values.map((_, i) => {
    const a = wmaHalf[i];
    const b = wmaFull[i];
    if (a === null || a === undefined || b === null || b === undefined) return null;
    return 2 * a - b;
  });

  // wma over the dense tail of diff
  let firstIdx = -1;
  for (let i = 0; i < diff.length; i++) {
    if (diff[i] !== null) {
      firstIdx = i;
      break;
    }
  }
  const out: (number | null)[] = values.map(() => null);
  if (firstIdx < 0) return out;
  const dense: number[] = [];
  for (let i = firstIdx; i < diff.length; i++) dense.push(diff[i] as number);
  const w = wma(dense, sqrtP);
  for (let j = 0; j < w.length; j++) out[firstIdx + j] = w[j] ?? null;
  return out;
}
