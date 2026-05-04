/**
 * Fourier cycle analysis — Discrete Fourier Transform for detecting
 * dominant cycles in price data.
 */

export interface FourierComponent {
  readonly period: number; // in bars
  readonly amplitude: number;
  readonly phase: number; // radians
  readonly power: number; // amplitude^2
}

/**
 * Compute the Discrete Fourier Transform of a real-valued series.
 * Returns frequency components sorted by power (strongest first).
 */
export function dft(series: readonly number[]): FourierComponent[] {
  const n = series.length;
  if (n < 4) return [];

  // Remove mean (detrend)
  const mean = series.reduce((s, v) => s + v, 0) / n;
  const detrended = series.map((v) => v - mean);

  const components: FourierComponent[] = [];
  const maxK = Math.floor(n / 2);

  for (let k = 1; k <= maxK; k++) {
    let real = 0;
    let imag = 0;

    for (let t = 0; t < n; t++) {
      const angle = (2 * Math.PI * k * t) / n;
      real += detrended[t]! * Math.cos(angle);
      imag -= detrended[t]! * Math.sin(angle);
    }

    real /= n;
    imag /= n;

    const amplitude = 2 * Math.sqrt(real * real + imag * imag);
    const phase = Math.atan2(imag, real);
    const period = n / k;

    components.push({ period, amplitude, phase, power: amplitude * amplitude });
  }

  return components.sort((a, b) => b.power - a.power);
}

/**
 * Find the dominant cycle periods (top N by power).
 */
export function dominantCycles(series: readonly number[], topN = 5): FourierComponent[] {
  return dft(series).slice(0, topN);
}

/**
 * Spectral density: power at each frequency.
 * Returns array of { period, power } sorted by period ascending.
 */
export function spectralDensity(series: readonly number[]): { period: number; power: number }[] {
  const components = dft(series);
  return components
    .map((c) => ({ period: c.period, power: c.power }))
    .sort((a, b) => a.period - b.period);
}

/**
 * Reconstruct signal from top N Fourier components.
 * Useful for visualizing the dominant cycle overlay on price.
 */
export function reconstructSignal(series: readonly number[], topN = 3): number[] {
  const n = series.length;
  if (n < 4) return [...series];

  const mean = series.reduce((s, v) => s + v, 0) / n;
  const top = dominantCycles(series, topN);

  const reconstructed: number[] = [];
  for (let t = 0; t < n; t++) {
    let value = mean;
    for (const comp of top) {
      const k = n / comp.period;
      const angle = (2 * Math.PI * k * t) / n;
      value += (comp.amplitude / 2) * Math.cos(angle + comp.phase);
    }
    reconstructed.push(value);
  }

  return reconstructed;
}

/**
 * Estimate the current cycle phase (0-1, where 0=trough, 0.5=peak).
 */
export function cyclePhaseEstimate(series: readonly number[]): number {
  const top = dominantCycles(series, 1);
  if (top.length === 0) return 0;

  const n = series.length;
  const k = n / top[0]!.period;
  const angle = (2 * Math.PI * k * (n - 1)) / n + top[0]!.phase;

  // Normalize to [0, 1]
  const normalized = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  return normalized / (2 * Math.PI);
}
