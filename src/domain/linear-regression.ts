/**
 * Ordinary least squares linear regression on (x, y) pairs and a
 * convenience for time-series values (uses index as x).
 * Returns slope, intercept, r² and a function to predict y for any x.
 */

export interface LinearRegression {
  readonly slope: number;
  readonly intercept: number;
  readonly r2: number;
  readonly predict: (x: number) => number;
}

export function linearRegression(xs: readonly number[], ys: readonly number[]): LinearRegression {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) {
    return { slope: 0, intercept: ys[0] ?? 0, r2: 0, predict: (): number => ys[0] ?? 0 };
  }
  let sumX = 0;
  let sumY = 0;
  for (let i = 0; i < n; i++) {
    sumX += xs[i]!;
    sumY += ys[i]!;
  }
  const meanX = sumX / n;
  const meanY = sumY / n;
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i]! - meanX;
    const dy = ys[i]! - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const slope = denX === 0 ? 0 : num / denX;
  const intercept = meanY - slope * meanX;
  const r2 = denX === 0 || denY === 0 ? 0 : (num * num) / (denX * denY);
  return {
    slope,
    intercept,
    r2,
    predict: (x: number): number => slope * x + intercept,
  };
}

/** Regression line for an evenly-spaced series; x is the index. */
export function regressionLine(values: readonly number[]): {
  fit: number[];
  slope: number;
  intercept: number;
  r2: number;
} {
  const n = values.length;
  const xs = Array.from({ length: n }, (_, i) => i);
  const reg = linearRegression(xs, values);
  const fit = xs.map((x) => reg.predict(x));
  return { fit, slope: reg.slope, intercept: reg.intercept, r2: reg.r2 };
}

/** Trend channel: regression line ± k standard deviations of residuals. */
export function regressionChannel(
  values: readonly number[],
  stdDevMultiplier = 2,
): { fit: number[]; upper: number[]; lower: number[] } {
  const { fit } = regressionLine(values);
  let sumSq = 0;
  for (let i = 0; i < values.length; i++) {
    const r = values[i]! - fit[i]!;
    sumSq += r * r;
  }
  const sd = values.length > 0 ? Math.sqrt(sumSq / values.length) : 0;
  const offset = stdDevMultiplier * sd;
  return {
    fit,
    upper: fit.map((v) => v + offset),
    lower: fit.map((v) => v - offset),
  };
}
