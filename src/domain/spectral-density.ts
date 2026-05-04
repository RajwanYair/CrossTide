/**
 * Spectral density estimation — periodogram and Welch's method.
 * Identifies dominant cycles/frequencies in time series.
 */

export interface SpectralDensity {
  readonly frequencies: readonly number[]; // normalized [0, 0.5]
  readonly power: readonly number[]; // spectral power at each freq
  readonly dominantFrequency: number; // frequency with max power
  readonly dominantPeriod: number; // 1 / dominant frequency
}

/**
 * Compute raw periodogram using DFT.
 *
 * S(f_k) = (1/N)|Σ x_t * e^{-i2πf_k t}|²
 *
 * @param series - Time series data
 */
export function periodogram(series: readonly number[]): SpectralDensity {
  const n = series.length;
  if (n < 4) return emptySpectral();

  // Demean
  const mean = series.reduce((s, v) => s + v, 0) / n;
  const centered = series.map((v) => v - mean);

  // Compute DFT for positive frequencies
  const nFreqs = Math.floor(n / 2);
  const frequencies: number[] = [];
  const power: number[] = [];

  for (let k = 1; k <= nFreqs; k++) {
    const freq = k / n;
    let re = 0,
      im = 0;
    for (let t = 0; t < n; t++) {
      const angle = (2 * Math.PI * k * t) / n;
      re += centered[t]! * Math.cos(angle);
      im -= centered[t]! * Math.sin(angle);
    }
    frequencies.push(freq);
    power.push((re * re + im * im) / n);
  }

  const maxIdx = power.indexOf(Math.max(...power));
  const dominantFreq = frequencies[maxIdx] ?? 0;

  return {
    frequencies,
    power,
    dominantFrequency: dominantFreq,
    dominantPeriod: dominantFreq > 0 ? 1 / dominantFreq : Infinity,
  };
}

/**
 * Welch's method: averaged periodogram with overlapping windows.
 * Reduces variance of spectral estimate.
 *
 * @param series - Time series data
 * @param windowSize - Size of each segment
 * @param overlap - Overlap fraction (0-1)
 */
export function welchSpectrum(
  series: readonly number[],
  windowSize?: number,
  overlap = 0.5,
): SpectralDensity {
  const n = series.length;
  if (n < 4) return emptySpectral();

  const segLen = windowSize ?? Math.min(256, Math.floor(n / 2));
  if (segLen < 4) return periodogram(series);

  const step = Math.max(1, Math.floor(segLen * (1 - overlap)));
  const nFreqs = Math.floor(segLen / 2);

  // Hann window
  const window: number[] = Array.from(
    { length: segLen },
    (_, i) => 0.5 * (1 - Math.cos((2 * Math.PI * i) / (segLen - 1))),
  );
  const windowPower = window.reduce((s, w) => s + w * w, 0);

  const avgPower = new Array(nFreqs).fill(0) as number[];
  let numSegments = 0;

  for (let start = 0; start + segLen <= n; start += step) {
    const segment = series.slice(start, start + segLen);
    const mean = segment.reduce((s, v) => s + v, 0) / segLen;
    const windowed = segment.map((v, i) => (v - mean) * window[i]!);

    for (let k = 1; k <= nFreqs; k++) {
      let re = 0,
        im = 0;
      for (let t = 0; t < segLen; t++) {
        const angle = (2 * Math.PI * k * t) / segLen;
        re += windowed[t]! * Math.cos(angle);
        im -= windowed[t]! * Math.sin(angle);
      }
      avgPower[k - 1] += (re * re + im * im) / windowPower;
    }
    numSegments++;
  }

  if (numSegments === 0) return periodogram(series);

  const frequencies: number[] = [];
  const power: number[] = [];

  for (let k = 0; k < nFreqs; k++) {
    frequencies.push((k + 1) / segLen);
    power.push(avgPower[k]! / numSegments);
  }

  const maxIdx = power.indexOf(Math.max(...power));
  const dominantFreq = frequencies[maxIdx] ?? 0;

  return {
    frequencies,
    power,
    dominantFrequency: dominantFreq,
    dominantPeriod: dominantFreq > 0 ? 1 / dominantFreq : Infinity,
  };
}

/**
 * Detect significant spectral peaks above noise floor.
 *
 * @param spectrum - Computed spectral density
 * @param threshold - Multiple of median power to consider significant
 */
export function detectPeaks(
  spectrum: SpectralDensity,
  threshold = 5,
): readonly { frequency: number; period: number; power: number }[] {
  const sorted = [...spectrum.power].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
  const cutoff = median * threshold;

  const peaks: { frequency: number; period: number; power: number }[] = [];
  for (let i = 1; i < spectrum.power.length - 1; i++) {
    const p = spectrum.power[i]!;
    if (p > cutoff && p > spectrum.power[i - 1]! && p > spectrum.power[i + 1]!) {
      peaks.push({
        frequency: spectrum.frequencies[i]!,
        period: 1 / spectrum.frequencies[i]!,
        power: p,
      });
    }
  }

  return peaks.sort((a, b) => b.power - a.power);
}

function emptySpectral(): SpectralDensity {
  return { frequencies: [], power: [], dominantFrequency: 0, dominantPeriod: Infinity };
}
