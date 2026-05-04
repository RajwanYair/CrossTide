import { describe, it, expect } from "vitest";
import { bayesianChangepoints, cusumChangepoints } from "../../../src/domain/changepoint-detection";

// Series with clear level shifts
const shiftSeries: number[] = [];
let seed = 66666;
function lcg(): number {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return (seed / 0xffffffff - 0.5) * 2;
}
// Segment 1: mean = 10
for (let i = 0; i < 100; i++) shiftSeries.push(10 + lcg() * 1);
// Segment 2: mean = 20 (big shift)
for (let i = 0; i < 100; i++) shiftSeries.push(20 + lcg() * 1);
// Segment 3: mean = 5 (another shift)
for (let i = 0; i < 100; i++) shiftSeries.push(5 + lcg() * 1);

// Constant series (no changepoints)
const constant = Array.from({ length: 100 }, () => 50 + lcg() * 0.1);

describe("changepoint-detection", () => {
  describe("bayesianChangepoints", () => {
    it("detects changepoints in shifted series", () => {
      const result = bayesianChangepoints(shiftSeries, 0.01, 0.3);
      expect(result.changepoints.length).toBeGreaterThan(0);
    });

    it("changepoint near index 100 (first shift)", () => {
      const result = bayesianChangepoints(shiftSeries, 0.01, 0.3);
      const nearFirst = result.changepoints.some((cp) => cp.index >= 85 && cp.index <= 130);
      expect(nearFirst).toBe(true);
    });

    it("runLengthProbs has correct length", () => {
      const result = bayesianChangepoints(shiftSeries, 0.01, 0.3);
      expect(result.runLengthProbs).toHaveLength(300);
    });

    it("segmentMeans has correct length", () => {
      const result = bayesianChangepoints(shiftSeries, 0.01, 0.3);
      expect(result.segmentMeans).toHaveLength(300);
    });

    it("no changepoints for constant series", () => {
      const result = bayesianChangepoints(constant, 0.01, 0.8);
      expect(result.changepoints.length).toBe(0);
    });

    it("returns empty for short series", () => {
      const result = bayesianChangepoints([1, 2, 3]);
      expect(result.changepoints).toEqual([]);
    });

    it("changepoint probabilities in [0, 1]", () => {
      const result = bayesianChangepoints(shiftSeries);
      for (const p of result.runLengthProbs) {
        expect(p).toBeGreaterThanOrEqual(0);
        expect(p).toBeLessThanOrEqual(1);
      }
    });
  });

  describe("cusumChangepoints", () => {
    it("detects shifts in level-change series", () => {
      const cps = cusumChangepoints(shiftSeries, 3);
      expect(cps.length).toBeGreaterThan(0);
    });

    it("no changepoints for constant series", () => {
      const cps = cusumChangepoints(constant, 5);
      expect(cps.length).toBe(0);
    });

    it("returns empty for short series", () => {
      expect(cusumChangepoints([1, 2, 3])).toEqual([]);
    });

    it("all indices valid", () => {
      const cps = cusumChangepoints(shiftSeries);
      for (const idx of cps) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(shiftSeries.length);
      }
    });
  });
});
