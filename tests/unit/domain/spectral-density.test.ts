import { describe, it, expect } from "vitest";
import { periodogram, welchSpectrum, detectPeaks } from "../../../src/domain/spectral-density";

// Generate sinusoidal signal with known frequency
const n = 256;
const freq1 = 0.1; // 10-period cycle
const freq2 = 0.25; // 4-period cycle
const signal = Array.from(
  { length: n },
  (_, t) => Math.sin(2 * Math.PI * freq1 * t) + 0.5 * Math.sin(2 * Math.PI * freq2 * t),
);

let seed = 99999;
function lcg(): number {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return (seed / 0xffffffff - 0.5) * 2;
}
const noise = Array.from({ length: n }, () => lcg() * 0.3);
const noisySignal = signal.map((s, i) => s + noise[i]!);

describe("spectral-density", () => {
  describe("periodogram", () => {
    it("detects dominant frequency of pure sine", () => {
      const result = periodogram(signal);
      // Dominant frequency should be close to freq1 (0.1) since it has larger amplitude
      expect(result.dominantFrequency).toBeCloseTo(freq1, 2);
    });

    it("returns correct number of frequencies", () => {
      const result = periodogram(signal);
      expect(result.frequencies.length).toBe(Math.floor(n / 2));
    });

    it("power is non-negative", () => {
      const result = periodogram(signal);
      for (const p of result.power) expect(p).toBeGreaterThanOrEqual(0);
    });

    it("empty for short series", () => {
      const result = periodogram([1, 2]);
      expect(result.frequencies.length).toBe(0);
    });
  });

  describe("welchSpectrum", () => {
    it("detects dominant frequency in noisy signal", () => {
      const result = welchSpectrum(noisySignal, 64);
      // Should still find the dominant frequency near 0.1
      expect(result.dominantFrequency).toBeCloseTo(freq1, 1);
    });

    it("reduces variance vs raw periodogram", () => {
      // Welch power should be smoother (less max/median ratio on noise-only)
      const pureNoise = Array.from({ length: 256 }, () => lcg());
      const rawPeaks = periodogram(pureNoise);
      const welchPeaks = welchSpectrum(pureNoise, 64);

      const rawMax = Math.max(...rawPeaks.power);
      const rawMed = [...rawPeaks.power].sort((a, b) => a - b)[
        Math.floor(rawPeaks.power.length / 2)
      ]!;
      const welchMax = Math.max(...welchPeaks.power);
      const welchMed = [...welchPeaks.power].sort((a, b) => a - b)[
        Math.floor(welchPeaks.power.length / 2)
      ]!;

      expect(welchMax / welchMed).toBeLessThan(rawMax / rawMed);
    });

    it("handles windowSize larger than series", () => {
      const short = [1, 2, 3, 4, 5, 6, 7, 8];
      const result = welchSpectrum(short, 16);
      // Falls back to periodogram
      expect(result.frequencies.length).toBeGreaterThan(0);
    });
  });

  describe("detectPeaks", () => {
    it("finds peaks at known frequencies", () => {
      const spectrum = periodogram(signal);
      const peaks = detectPeaks(spectrum, 3);
      const peakFreqs = peaks.map((p) => p.frequency);
      // Should contain frequency near 0.1
      expect(peakFreqs.some((f) => Math.abs(f - freq1) < 0.02)).toBe(true);
    });

    it("no peaks in white noise with high threshold", () => {
      const whiteNoise = Array.from({ length: 128 }, () => lcg());
      const spectrum = periodogram(whiteNoise);
      const peaks = detectPeaks(spectrum, 100);
      expect(peaks.length).toBeLessThan(3);
    });

    it("peaks sorted by power descending", () => {
      const spectrum = periodogram(signal);
      const peaks = detectPeaks(spectrum, 2);
      for (let i = 1; i < peaks.length; i++) {
        expect(peaks[i]!.power).toBeLessThanOrEqual(peaks[i - 1]!.power);
      }
    });
  });
});
