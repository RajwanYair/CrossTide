/**
 * Entropy analysis — measures disorder/randomness in time series.
 * Higher entropy = more random/unpredictable, lower = more ordered/predictable.
 */

/**
 * Shannon entropy of a binned distribution.
 * Bins data into `bins` equal-width buckets and computes -Σ p·log2(p).
 */
export function shannonEntropy(data: readonly number[], bins = 10): number {
  const n = data.length;
  if (n < 2) return 0;

  const min = Math.min(...data);
  const max = Math.max(...data);
  if (min === max) return 0;

  const width = (max - min) / bins;
  const counts = new Array<number>(bins).fill(0);

  for (const v of data) {
    const idx = Math.min(Math.floor((v - min) / width), bins - 1);
    counts[idx]!++;
  }

  let entropy = 0;
  for (const c of counts) {
    if (c > 0) {
      const p = c / n;
      entropy -= p * Math.log2(p);
    }
  }

  return entropy;
}

/**
 * Normalized Shannon entropy in [0, 1].
 * 0 = perfectly ordered, 1 = maximum disorder.
 */
export function normalizedEntropy(data: readonly number[], bins = 10): number {
  if (data.length < 2) return 0;
  const maxEntropy = Math.log2(Math.min(bins, data.length));
  if (maxEntropy === 0) return 0;
  return shannonEntropy(data, bins) / maxEntropy;
}

/**
 * Permutation entropy (Bandt-Pompe).
 * Embeds the time series in vectors of length `order` and counts ordinal patterns.
 * Captures temporal structure independent of distribution.
 */
export function permutationEntropy(data: readonly number[], order = 3, delay = 1): number {
  const n = data.length;
  const numVectors = n - (order - 1) * delay;
  if (numVectors < 1) return 0;

  const patternCounts = new Map<string, number>();

  for (let i = 0; i < numVectors; i++) {
    // Extract vector and compute rank pattern
    const indices = Array.from({ length: order }, (_, k) => k);
    indices.sort((a, b) => {
      const va = data[i + a * delay]!;
      const vb = data[i + b * delay]!;
      return va - vb || a - b;
    });
    const pattern = indices.join(",");
    patternCounts.set(pattern, (patternCounts.get(pattern) ?? 0) + 1);
  }

  let entropy = 0;
  for (const count of patternCounts.values()) {
    const p = count / numVectors;
    entropy -= p * Math.log2(p);
  }

  return entropy;
}

/**
 * Normalized permutation entropy in [0, 1].
 */
export function normalizedPermutationEntropy(
  data: readonly number[],
  order = 3,
  delay = 1,
): number {
  const maxEntropy = Math.log2(factorial(order));
  if (maxEntropy === 0) return 0;
  return permutationEntropy(data, order, delay) / maxEntropy;
}

/**
 * Sample entropy — measures complexity/regularity without self-matches.
 * Lower values indicate more self-similarity/predictability.
 */
export function sampleEntropy(data: readonly number[], m = 2, r?: number): number {
  const n = data.length;
  if (n < m + 1) return 0;

  const tolerance = r ?? 0.2 * std(data);
  if (tolerance === 0) return 0;

  let countM = 0;
  let countM1 = 0;

  for (let i = 0; i < n - m; i++) {
    for (let j = i + 1; j < n - m; j++) {
      // Check template match of length m
      let matchM = true;
      for (let k = 0; k < m; k++) {
        if (Math.abs(data[i + k]! - data[j + k]!) > tolerance) {
          matchM = false;
          break;
        }
      }
      if (matchM) {
        countM++;
        // Check if template match extends to length m+1
        if (Math.abs(data[i + m]! - data[j + m]!) <= tolerance) {
          countM1++;
        }
      }
    }
  }

  if (countM === 0) return 0;
  return -Math.log(countM1 / countM);
}

/**
 * Interpret entropy level as market state.
 */
export function interpretEntropy(normalizedEnt: number): string {
  if (normalizedEnt < 0.3) return "highly-ordered";
  if (normalizedEnt < 0.6) return "moderate";
  if (normalizedEnt < 0.85) return "complex";
  return "near-random";
}

function factorial(n: number): number {
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

function std(data: readonly number[]): number {
  const n = data.length;
  if (n < 2) return 0;
  const mean = data.reduce((s, v) => s + v, 0) / n;
  let ss = 0;
  for (const v of data) ss += (v - mean) ** 2;
  return Math.sqrt(ss / (n - 1));
}
