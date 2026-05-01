/**
 * Perry Kaufman's Adaptive Moving Average (KAMA). Reacts faster when
 * trend is strong (low noise) and smooths heavily when noisy.
 *
 *   ER  = |close - close[n]| / sum(|close[i]-close[i-1]|, n)
 *   sc  = (ER * (fast - slow) + slow)^2     where fast = 2/(2+1), slow = 2/(30+1)
 *   KAMA = prevKAMA + sc * (close - prevKAMA)
 */

export interface KamaOptions {
  readonly period?: number;
  readonly fast?: number;
  readonly slow?: number;
}

export function computeKama(
  values: readonly number[],
  opts: KamaOptions = {},
): Array<number | null> {
  const period = opts.period ?? 10;
  const fast = opts.fast ?? 2;
  const slow = opts.slow ?? 30;
  const n = values.length;
  const out: Array<number | null> = new Array(n).fill(null);
  if (n === 0 || period < 1) return out;

  const fastSc = 2 / (fast + 1);
  const slowSc = 2 / (slow + 1);

  // Seed with SMA at index period-1 if possible.
  if (n <= period) return out;
  let seed = 0;
  for (let i = 0; i < period; i++) seed += values[i]!;
  out[period - 1] = seed / period;

  for (let i = period; i < n; i++) {
    const change = Math.abs(values[i]! - values[i - period]!);
    let volatility = 0;
    for (let k = i - period + 1; k <= i; k++) {
      volatility += Math.abs(values[k]! - values[k - 1]!);
    }
    const er = volatility === 0 ? 0 : change / volatility;
    const sc = Math.pow(er * (fastSc - slowSc) + slowSc, 2);
    const prev = out[i - 1]!;
    out[i] = prev + sc * (values[i]! - prev);
  }
  return out;
}
