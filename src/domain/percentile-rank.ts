/**
 * Percentile Rank utilities.
 *   percentile(values, p) — linear interpolation, p in [0, 100].
 *   percentRank(values, target) — fraction of values <= target, in [0, 100].
 *   rollingPercentRank(series, window) — for each i, percentRank of series[i]
 *     within the prior `window` values (inclusive of i).
 */

export function percentile(values: readonly number[], p: number): number | null {
  if (values.length === 0) return null;
  const clamped = Math.max(0, Math.min(100, p));
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 1) return sorted[0]!;
  const rank = (clamped / 100) * (sorted.length - 1);
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  if (lo === hi) return sorted[lo]!;
  const frac = rank - lo;
  return sorted[lo]! * (1 - frac) + sorted[hi]! * frac;
}

export function percentRank(values: readonly number[], target: number): number | null {
  if (values.length === 0) return null;
  let count = 0;
  for (const v of values) if (v <= target) count++;
  return (100 * count) / values.length;
}

export function rollingPercentRank(series: readonly number[], window: number): (number | null)[] {
  const out: (number | null)[] = new Array(series.length).fill(null);
  if (window <= 0) return out;
  for (let i = window - 1; i < series.length; i++) {
    let count = 0;
    const target = series[i]!;
    for (let j = i - window + 1; j <= i; j++) {
      if (series[j]! <= target) count++;
    }
    out[i] = (100 * count) / window;
  }
  return out;
}
