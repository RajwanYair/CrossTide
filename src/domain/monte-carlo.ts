/**
 * Monte Carlo simulation — generate random portfolio outcome
 * scenarios using historical return distributions.
 */

export interface MonteCarloConfig {
  readonly initialValue: number;
  readonly periods: number; // number of periods to simulate
  readonly simulations: number; // number of paths
  readonly meanReturn: number; // per-period mean return (decimal)
  readonly stdDev: number; // per-period standard deviation (decimal)
  readonly seed?: number;
}

export interface MonteCarloResult {
  readonly paths: readonly number[][]; // each path is array of portfolio values
  readonly finalValues: readonly number[];
  readonly percentiles: {
    readonly p5: number;
    readonly p25: number;
    readonly p50: number;
    readonly p75: number;
    readonly p95: number;
  };
  readonly probabilityOfLoss: number;
  readonly expectedValue: number;
}

/**
 * Simple seeded PRNG (mulberry32).
 */
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Box-Muller transform for normal distribution.
 */
function normalRandom(rng: () => number): number {
  const u1 = rng();
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1 || 1e-10)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Compute percentile from sorted array.
 */
function percentile(sorted: readonly number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower]!;
  return sorted[lower]! + (sorted[upper]! - sorted[lower]!) * (idx - lower);
}

/**
 * Run Monte Carlo simulation.
 */
export function runSimulation(config: MonteCarloConfig): MonteCarloResult {
  const { initialValue, periods, simulations, meanReturn, stdDev, seed } = config;
  const rng = mulberry32(seed ?? Date.now());

  const paths: number[][] = [];
  const finalValues: number[] = [];

  for (let s = 0; s < simulations; s++) {
    const path: number[] = [initialValue];
    let value = initialValue;

    for (let t = 0; t < periods; t++) {
      const r = meanReturn + stdDev * normalRandom(rng);
      value = value * (1 + r);
      path.push(value);
    }

    paths.push(path);
    finalValues.push(value);
  }

  const sorted = [...finalValues].sort((a, b) => a - b);

  const probabilityOfLoss = sorted.filter((v) => v < initialValue).length / simulations;
  const expectedValue = finalValues.reduce((s, v) => s + v, 0) / simulations;

  return {
    paths,
    finalValues,
    percentiles: {
      p5: percentile(sorted, 5),
      p25: percentile(sorted, 25),
      p50: percentile(sorted, 50),
      p75: percentile(sorted, 75),
      p95: percentile(sorted, 95),
    },
    probabilityOfLoss,
    expectedValue,
  };
}

/**
 * Estimate mean and stdDev from historical returns.
 */
export function estimateParams(returns: readonly number[]): { mean: number; stdDev: number } {
  if (returns.length === 0) return { mean: 0, stdDev: 0 };
  const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
  const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length;
  return { mean, stdDev: Math.sqrt(variance) };
}
