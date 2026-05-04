import { describe, it, expect } from "vitest";
import {
  hedgeRatio,
  pairsSpread,
  spreadZScore,
  pairsSignals,
} from "../../../src/domain/pairs-trading";

// Cointegrated pair: Y = 2*X + noise, mean-reverting spread
let seed = 55555;
function lcg(): number {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return (seed / 0xffffffff - 0.5) * 2;
}
const n = 200;
const seriesX: number[] = [100];
const seriesY: number[] = [];
for (let i = 1; i < n; i++) seriesX.push(seriesX[i - 1]! + lcg() * 2);
for (let i = 0; i < n; i++) seriesY.push(2 * seriesX[i]! + 10 + lcg() * 5);

// Divergent pair for signal generation
const divergentX: number[] = [];
const divergentY: number[] = [];
let spread = 0;
for (let i = 0; i < 300; i++) {
  divergentX.push(100 + lcg() * 2);
  // Spread mean-reverts but has large excursions
  spread = spread * 0.95 + lcg() * 8;
  divergentY.push(divergentX[i]! + spread);
}

describe("pairs-trading", () => {
  describe("hedgeRatio", () => {
    it("estimates ratio close to 2 for Y = 2X + noise", () => {
      const beta = hedgeRatio(seriesY, seriesX);
      expect(beta).toBeGreaterThan(1.5);
      expect(beta).toBeLessThan(2.5);
    });

    it("returns 1 for single element", () => {
      expect(hedgeRatio([5], [3])).toBe(1);
    });
  });

  describe("pairsSpread", () => {
    it("spread has correct length", () => {
      const spread = pairsSpread(seriesY, seriesX);
      expect(spread).toHaveLength(n);
    });

    it("spread is mean-reverting (low autocorrelation)", () => {
      const sp = pairsSpread(seriesY, seriesX);
      const mean = sp.reduce((s, v) => s + v, 0) / sp.length;
      // Count zero-crossings (relative to mean)
      let crossings = 0;
      for (let i = 1; i < sp.length; i++) {
        if ((sp[i]! - mean) * (sp[i - 1]! - mean) < 0) crossings++;
      }
      // Mean-reverting should cross mean frequently
      expect(crossings).toBeGreaterThan(n * 0.1);
    });
  });

  describe("spreadZScore", () => {
    it("returns same length as input", () => {
      const z = spreadZScore([1, 2, 3, 4, 5]);
      expect(z).toHaveLength(5);
    });

    it("z-scores have near-zero mean (full window)", () => {
      const sp = pairsSpread(seriesY, seriesX);
      const z = spreadZScore(sp);
      const mean = z.reduce((s, v) => s + v, 0) / z.length;
      expect(Math.abs(mean)).toBeLessThan(0.5);
    });

    it("handles empty input", () => {
      expect(spreadZScore([])).toEqual([]);
    });
  });

  describe("pairsSignals", () => {
    it("generates trading signals", () => {
      const result = pairsSignals(divergentY, divergentX, { entryZ: 1.5 });
      expect(result.signals.length).toBeGreaterThan(0);
    });

    it("signals alternate entry/close", () => {
      const result = pairsSignals(divergentY, divergentX, { entryZ: 1.5 });
      for (let i = 0; i < result.signals.length - 1; i += 2) {
        const entry = result.signals[i]!;
        const exit = result.signals[i + 1];
        expect(entry.action).toMatch(/long-spread|short-spread/);
        if (exit) expect(exit.action).toBe("close");
      }
    });

    it("returns valid hedge ratio", () => {
      const result = pairsSignals(seriesY, seriesX);
      expect(result.hedgeRatio).toBeGreaterThan(0);
    });

    it("spreadStd is positive", () => {
      const result = pairsSignals(seriesY, seriesX);
      expect(result.spreadStd).toBeGreaterThan(0);
    });
  });
});
