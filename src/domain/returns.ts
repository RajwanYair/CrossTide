/**
 * Returns calculations: simple, log, cumulative, and rolling.
 * All functions assume non-empty inputs return [] and treat the first
 * value as the baseline (no return for index 0).
 */

export function simpleReturns(prices: readonly number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const prev = prices[i - 1]!;
    const curr = prices[i]!;
    out.push(prev === 0 ? 0 : (curr - prev) / prev);
  }
  return out;
}

export function logReturns(prices: readonly number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const prev = prices[i - 1]!;
    const curr = prices[i]!;
    if (prev <= 0 || curr <= 0) {
      out.push(0);
    } else {
      out.push(Math.log(curr / prev));
    }
  }
  return out;
}

/** Cumulative return series starting at 0 (e.g. [0, 0.05, 0.07]). */
export function cumulativeReturns(returns: readonly number[]): number[] {
  const out: number[] = [];
  let cum = 1;
  for (const r of returns) {
    cum *= 1 + r;
    out.push(cum - 1);
  }
  return out;
}

/** Total return between first and last price (compound). */
export function totalReturn(prices: readonly number[]): number {
  if (prices.length < 2) return 0;
  const first = prices[0]!;
  const last = prices[prices.length - 1]!;
  if (first === 0) return 0;
  return (last - first) / first;
}

/** Annualized return given total return and number of years. */
export function annualizedReturn(total: number, years: number): number {
  if (years <= 0) return 0;
  return Math.pow(1 + total, 1 / years) - 1;
}

export function rollingReturns(
  prices: readonly number[],
  window: number,
): number[] {
  if (window <= 0) return [];
  const out: number[] = [];
  for (let i = window; i < prices.length; i++) {
    const prev = prices[i - window]!;
    const curr = prices[i]!;
    out.push(prev === 0 ? 0 : (curr - prev) / prev);
  }
  return out;
}
