import { describe, it, expect } from "vitest";
import {
  shannonEntropy,
  normalizedEntropy,
  permutationEntropy,
  normalizedPermutationEntropy,
  sampleEntropy,
  interpretEntropy,
} from "../../../src/domain/entropy";

// Deterministic data generators
const uniform100 = Array.from({ length: 100 }, (_, i) => i / 100);
const constant100 = Array.from({ length: 100 }, () => 5);
const sine200 = Array.from({ length: 200 }, (_, i) => Math.sin(i * 0.1));

// Pseudo-random via LCG
let seed = 42424242;
function lcg(): number {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 0xffffffff;
}
const random200 = Array.from({ length: 200 }, () => lcg());

describe("entropy", () => {
  describe("shannonEntropy", () => {
    it("returns 0 for constant series", () => {
      expect(shannonEntropy(constant100)).toBe(0);
    });

    it("returns positive for uniform series", () => {
      expect(shannonEntropy(uniform100)).toBeGreaterThan(0);
    });

    it("higher for random than sine", () => {
      expect(shannonEntropy(random200)).toBeGreaterThan(shannonEntropy(sine200));
    });

    it("returns 0 for single element", () => {
      expect(shannonEntropy([5])).toBe(0);
    });
  });

  describe("normalizedEntropy", () => {
    it("returns value in [0, 1]", () => {
      const ne = normalizedEntropy(random200);
      expect(ne).toBeGreaterThanOrEqual(0);
      expect(ne).toBeLessThanOrEqual(1);
    });

    it("returns 0 for constant", () => {
      expect(normalizedEntropy(constant100)).toBe(0);
    });
  });

  describe("permutationEntropy", () => {
    it("returns 0 for monotonic increasing series", () => {
      const mono = Array.from({ length: 100 }, (_, i) => i);
      expect(permutationEntropy(mono, 3)).toBe(0);
    });

    it("higher for random than sine", () => {
      expect(permutationEntropy(random200, 3)).toBeGreaterThan(permutationEntropy(sine200, 3));
    });

    it("returns 0 for too-short series", () => {
      expect(permutationEntropy([1, 2], 3)).toBe(0);
    });
  });

  describe("normalizedPermutationEntropy", () => {
    it("returns value in [0, 1]", () => {
      const npe = normalizedPermutationEntropy(random200, 3);
      expect(npe).toBeGreaterThanOrEqual(0);
      expect(npe).toBeLessThanOrEqual(1);
    });

    it("near 1 for random data", () => {
      expect(normalizedPermutationEntropy(random200, 3)).toBeGreaterThan(0.8);
    });
  });

  describe("sampleEntropy", () => {
    it("returns 0 for constant series", () => {
      expect(sampleEntropy(constant100)).toBe(0);
    });

    it("positive for random data", () => {
      expect(sampleEntropy(random200, 2)).toBeGreaterThan(0);
    });

    it("lower for sine (regular) than random", () => {
      expect(sampleEntropy(sine200, 2)).toBeLessThan(sampleEntropy(random200, 2));
    });
  });

  describe("interpretEntropy", () => {
    it("highly-ordered for low values", () => {
      expect(interpretEntropy(0.1)).toBe("highly-ordered");
    });

    it("near-random for high values", () => {
      expect(interpretEntropy(0.9)).toBe("near-random");
    });
  });
});
