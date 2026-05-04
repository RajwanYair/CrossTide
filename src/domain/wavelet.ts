/**
 * Wavelet decomposition — multi-resolution analysis for price series.
 * Uses Haar wavelet (simplest orthogonal wavelet) for signal decomposition.
 */

export interface WaveletLevel {
  readonly level: number;
  readonly detail: readonly number[]; // detail coefficients (high-frequency)
  readonly approx: readonly number[]; // approximation coefficients (low-frequency)
}

export interface WaveletDecomposition {
  readonly levels: readonly WaveletLevel[];
  readonly trend: readonly number[]; // final approximation (lowest frequency)
  readonly reconstructed: readonly number[];
}

/**
 * Haar wavelet forward transform — one level.
 * Splits signal into approximation (average) and detail (difference) coefficients.
 */
export function haarForward(signal: readonly number[]): { approx: number[]; detail: number[] } {
  const n = signal.length;
  const half = Math.floor(n / 2);
  const approx: number[] = [];
  const detail: number[] = [];
  const sqrt2 = Math.SQRT2;

  for (let i = 0; i < half; i++) {
    const a = signal[2 * i]!;
    const b = signal[2 * i + 1]!;
    approx.push((a + b) / sqrt2);
    detail.push((a - b) / sqrt2);
  }

  return { approx, detail };
}

/**
 * Haar wavelet inverse transform — one level.
 */
export function haarInverse(approx: readonly number[], detail: readonly number[]): number[] {
  const n = approx.length;
  const sqrt2 = Math.SQRT2;
  const result: number[] = new Array(n * 2);

  for (let i = 0; i < n; i++) {
    result[2 * i] = (approx[i]! + detail[i]!) / sqrt2;
    result[2 * i + 1] = (approx[i]! - detail[i]!) / sqrt2;
  }

  return result;
}

/**
 * Multi-level Haar wavelet decomposition.
 * Decomposes signal into `maxLevel` resolution levels.
 */
export function waveletDecompose(
  signal: readonly number[],
  maxLevel?: number,
): WaveletDecomposition {
  const n = signal.length;
  if (n < 2) {
    return { levels: [], trend: signal.slice(), reconstructed: signal.slice() };
  }

  // Pad to power of 2 for clean decomposition
  const padLen = nextPow2(n);
  const padded = signal.slice();
  while (padded.length < padLen) padded.push(padded[padded.length - 1]!);

  const maxLevels = maxLevel ?? Math.min(Math.floor(Math.log2(padLen)), 6);
  const levels: WaveletLevel[] = [];
  let current: number[] = padded;

  for (let level = 1; level <= maxLevels; level++) {
    if (current.length < 2) break;
    const { approx, detail } = haarForward(current);
    levels.push({ level, detail, approx });
    current = approx;
  }

  // Reconstruct from decomposition
  const reconstructed = waveletReconstruct(levels, current);

  return {
    levels,
    trend: current,
    reconstructed: reconstructed.slice(0, n),
  };
}

/**
 * Reconstruct signal from wavelet levels.
 */
function waveletReconstruct(levels: readonly WaveletLevel[], trend: readonly number[]): number[] {
  let signal = trend.slice();
  for (let i = levels.length - 1; i >= 0; i--) {
    signal = haarInverse(signal, levels[i]!.detail);
  }
  return signal;
}

/**
 * Denoise signal by zeroing detail coefficients below threshold.
 * Uses universal threshold: σ * √(2 * ln(n)).
 */
export function waveletDenoise(signal: readonly number[], threshold?: number): number[] {
  const n = signal.length;
  if (n < 4) return signal.slice();

  const decomp = waveletDecompose(signal);
  if (decomp.levels.length === 0) return signal.slice();

  // Compute threshold from finest detail coefficients (MAD estimator)
  const finest = decomp.levels[0]!.detail;
  const sigma = medianAbsDeviation(finest) / 0.6745;
  const thresh = threshold ?? sigma * Math.sqrt(2 * Math.log(n));

  // Apply soft thresholding to detail coefficients
  const thresholdedLevels: WaveletLevel[] = decomp.levels.map((level) => ({
    ...level,
    detail: level.detail.map((d) => softThreshold(d, thresh)),
  }));

  // Reconstruct
  let current = decomp.trend.slice();
  for (let i = thresholdedLevels.length - 1; i >= 0; i--) {
    current = haarInverse(current, thresholdedLevels[i]!.detail);
  }

  return current.slice(0, n);
}

/**
 * Extract energy at each wavelet scale — useful for identifying dominant cycles.
 */
export function waveletEnergy(signal: readonly number[]): number[] {
  const decomp = waveletDecompose(signal);
  return decomp.levels.map((level) => {
    let energy = 0;
    for (const d of level.detail) energy += d * d;
    return energy / level.detail.length;
  });
}

function softThreshold(x: number, t: number): number {
  if (x > t) return x - t;
  if (x < -t) return x + t;
  return 0;
}

function medianAbsDeviation(data: readonly number[]): number {
  const sorted = data.slice().sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)]!;
  const absDevs = sorted.map((v) => Math.abs(v - median)).sort((a, b) => a - b);
  return absDevs[Math.floor(absDevs.length / 2)]!;
}

function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}
