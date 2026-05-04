/**
 * Fractal dimension — measures market complexity and roughness.
 * Higher fractal dimension = more random/choppy; lower = more trending.
 */

/**
 * Higuchi fractal dimension estimate.
 * Measures self-similarity across multiple time scales.
 * @param series Price or return series
 * @param kMax Maximum interval (default: series.length / 4)
 */
export function higuchiFractalDimension(series: readonly number[], kMax?: number): number {
  const n = series.length;
  if (n < 10) return 0;

  const maxK = kMax ?? Math.min(Math.floor(n / 4), 50);
  if (maxK < 2) return 0;

  const lnK: number[] = [];
  const lnL: number[] = [];

  for (let k = 1; k <= maxK; k++) {
    let sumL = 0;
    let count = 0;

    for (let m = 1; m <= k; m++) {
      let length = 0;
      const numPoints = Math.floor((n - m) / k);
      if (numPoints < 1) continue;

      for (let i = 1; i <= numPoints; i++) {
        length += Math.abs(series[m - 1 + i * k]! - series[m - 1 + (i - 1) * k]!);
      }

      length *= (n - 1) / (numPoints * k * k);
      sumL += length;
      count++;
    }

    if (count > 0) {
      lnK.push(Math.log(1 / k));
      lnL.push(Math.log(sumL / count));
    }
  }

  if (lnK.length < 2) return 0;

  // Linear regression of ln(L) vs ln(1/k) — slope is fractal dimension
  return linearSlope(lnK, lnL);
}

/**
 * Box-counting fractal dimension (simplified for 1D series).
 * Counts how many boxes of size ε are needed to cover the series.
 */
export function boxCountingDimension(series: readonly number[], numScales = 10): number {
  const n = series.length;
  if (n < 10) return 0;

  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min;
  if (range === 0) return 0;

  const lnEps: number[] = [];
  const lnN: number[] = [];

  for (let s = 1; s <= numScales; s++) {
    const boxSize = range / (s * 2);
    if (boxSize === 0) continue;

    const timeStep = Math.max(1, Math.floor(n / (s * 5)));
    const boxes = new Set<string>();

    for (let i = 0; i < n; i += timeStep) {
      const bx = Math.floor(i / timeStep);
      const by = Math.floor((series[i]! - min) / boxSize);
      boxes.add(`${bx},${by}`);
    }

    if (boxes.size > 0) {
      lnEps.push(Math.log(1 / boxSize));
      lnN.push(Math.log(boxes.size));
    }
  }

  if (lnEps.length < 2) return 0;
  return Math.max(1, Math.min(2, linearSlope(lnEps, lnN)));
}

/**
 * Katz fractal dimension — simple estimator using path length.
 * FD = log(L/d) / log(L/d + log(n))
 * where L = total path length, d = max displacement, n = number of points
 */
export function katzFractalDimension(series: readonly number[]): number {
  const n = series.length;
  if (n < 3) return 0;

  let totalLength = 0;
  let maxDist = 0;

  for (let i = 1; i < n; i++) {
    const dist = Math.abs(series[i]! - series[i - 1]!);
    totalLength += dist;

    const displacement = Math.abs(series[i]! - series[0]!);
    if (displacement > maxDist) maxDist = displacement;
  }

  if (maxDist === 0 || totalLength === 0) return 0;

  const logRatio = Math.log(totalLength / maxDist);
  return logRatio / (logRatio + Math.log(n));
}

/**
 * Interpret fractal dimension value.
 */
export function interpretFractalDimension(fd: number): string {
  if (fd <= 0) return "insufficient data";
  if (fd < 1.3) return "trending (low complexity)";
  if (fd < 1.5) return "moderate complexity";
  if (fd < 1.7) return "random walk (efficient)";
  return "anti-persistent / choppy";
}

/**
 * Simple linear regression slope.
 */
function linearSlope(x: readonly number[], y: readonly number[]): number {
  const n = x.length;
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i]!;
    sumY += y[i]!;
    sumXY += x[i]! * y[i]!;
    sumX2 += x[i]! * x[i]!;
  }
  const denom = n * sumX2 - sumX * sumX;
  return denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
}
