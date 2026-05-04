import { describe, it, expect } from "vitest";
import {
  haarForward,
  haarInverse,
  waveletDecompose,
  waveletDenoise,
  waveletEnergy,
} from "../../../src/domain/wavelet";

const sine64 = Array.from({ length: 64 }, (_, i) => Math.sin(i * 0.2));
const linear32 = Array.from({ length: 32 }, (_, i) => i * 0.5);

// Noisy signal
let seed = 9999;
function lcg(): number {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return (seed / 0xffffffff - 0.5) * 2;
}
const noisySine = Array.from({ length: 128 }, (_, i) => Math.sin(i * 0.1) + lcg() * 0.3);

describe("wavelet", () => {
  describe("haarForward / haarInverse", () => {
    it("forward produces correct length", () => {
      const { approx, detail } = haarForward([1, 3, 5, 7]);
      expect(approx).toHaveLength(2);
      expect(detail).toHaveLength(2);
    });

    it("inverse recovers original", () => {
      const original = [1, 3, 5, 7, 2, 4, 6, 8];
      const { approx, detail } = haarForward(original);
      const recovered = haarInverse(approx, detail);
      for (let i = 0; i < original.length; i++) {
        expect(recovered[i]).toBeCloseTo(original[i]!, 10);
      }
    });
  });

  describe("waveletDecompose", () => {
    it("returns levels for sine signal", () => {
      const decomp = waveletDecompose(sine64);
      expect(decomp.levels.length).toBeGreaterThan(0);
    });

    it("reconstruction matches original", () => {
      const decomp = waveletDecompose(linear32);
      for (let i = 0; i < linear32.length; i++) {
        expect(decomp.reconstructed[i]).toBeCloseTo(linear32[i]!, 8);
      }
    });

    it("handles single element", () => {
      const decomp = waveletDecompose([5]);
      expect(decomp.levels).toHaveLength(0);
      expect(decomp.trend).toEqual([5]);
    });

    it("trend is shorter than original", () => {
      const decomp = waveletDecompose(sine64);
      expect(decomp.trend.length).toBeLessThan(64);
    });
  });

  describe("waveletDenoise", () => {
    it("denoised signal is smoother than noisy", () => {
      const denoised = waveletDenoise(noisySine);
      // Total variation (sum of |consecutive differences|) measures roughness
      const noisyTV = totalVariation(noisySine);
      const denoisedTV = totalVariation(denoised);
      expect(denoisedTV).toBeLessThan(noisyTV);
    });

    it("returns same length", () => {
      const denoised = waveletDenoise(noisySine);
      expect(denoised).toHaveLength(noisySine.length);
    });

    it("short series returned as-is", () => {
      expect(waveletDenoise([1, 2])).toEqual([1, 2]);
    });
  });

  describe("waveletEnergy", () => {
    it("returns energy per level", () => {
      const energy = waveletEnergy(sine64);
      expect(energy.length).toBeGreaterThan(0);
      for (const e of energy) expect(e).toBeGreaterThanOrEqual(0);
    });

    it("energy sum is positive for non-constant", () => {
      const energy = waveletEnergy(sine64);
      const total = energy.reduce((s, e) => s + e, 0);
      expect(total).toBeGreaterThan(0);
    });
  });
});

function _variance(data: number[]): number {
  const mean = data.reduce((s, v) => s + v, 0) / data.length;
  return data.reduce((s, v) => s + (v - mean) ** 2, 0) / data.length;
}

function totalVariation(data: readonly number[]): number {
  let tv = 0;
  for (let i = 1; i < data.length; i++) tv += Math.abs(data[i]! - data[i - 1]!);
  return tv;
}
