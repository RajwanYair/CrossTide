/**
 * Rolling statistics over a numeric series: mean, sample standard
 * deviation, variance, min/max, z-score. Single-pass per metric using
 * sliding-window updates where possible.
 */

export function rollingMean(values: readonly number[], window: number): number[] {
  if (window <= 0 || values.length < window) return [];
  const out: number[] = [];
  let sum = 0;
  for (let i = 0; i < window; i++) sum += values[i]!;
  out.push(sum / window);
  for (let i = window; i < values.length; i++) {
    sum += values[i]! - values[i - window]!;
    out.push(sum / window);
  }
  return out;
}

/** Sample standard deviation (Bessel-corrected, n-1). */
export function rollingStdDev(
  values: readonly number[],
  window: number,
): number[] {
  if (window <= 1 || values.length < window) return [];
  const out: number[] = [];
  for (let i = window - 1; i < values.length; i++) {
    let sum = 0;
    for (let j = i - window + 1; j <= i; j++) sum += values[j]!;
    const mean = sum / window;
    let sq = 0;
    for (let j = i - window + 1; j <= i; j++) {
      const d = values[j]! - mean;
      sq += d * d;
    }
    out.push(Math.sqrt(sq / (window - 1)));
  }
  return out;
}

export function rollingMin(values: readonly number[], window: number): number[] {
  if (window <= 0 || values.length < window) return [];
  const out: number[] = [];
  for (let i = window - 1; i < values.length; i++) {
    let m = values[i - window + 1]!;
    for (let j = i - window + 2; j <= i; j++) {
      if (values[j]! < m) m = values[j]!;
    }
    out.push(m);
  }
  return out;
}

export function rollingMax(values: readonly number[], window: number): number[] {
  if (window <= 0 || values.length < window) return [];
  const out: number[] = [];
  for (let i = window - 1; i < values.length; i++) {
    let m = values[i - window + 1]!;
    for (let j = i - window + 2; j <= i; j++) {
      if (values[j]! > m) m = values[j]!;
    }
    out.push(m);
  }
  return out;
}

/** z = (x - mean(window)) / stdDev(window) for each terminal index. */
export function rollingZScore(
  values: readonly number[],
  window: number,
): number[] {
  const means = rollingMean(values, window);
  const sds = rollingStdDev(values, window);
  const out: number[] = [];
  for (let i = 0; i < means.length; i++) {
    const x = values[i + window - 1]!;
    const sd = sds[i] ?? 0;
    out.push(sd === 0 ? 0 : (x - means[i]!) / sd);
  }
  return out;
}
