import { describe, it, expect } from "vitest";
import {
  grangerCausality,
  bidirectionalGranger,
  selectLagOrder,
} from "../../../src/domain/granger-causality";

// Create causal pair: X causes Y with 2-period lag
let seed = 11111;
function lcg(): number {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return (seed / 0xffffffff - 0.5) * 2;
}

const n = 300;
const x: number[] = [];
const y: number[] = [];

// X is random walk
for (let i = 0; i < n; i++) x.push(i === 0 ? 0 : x[i - 1]! + lcg() * 0.5);
// Y follows X with lag 2 + noise
for (let i = 0; i < n; i++) {
  const lagged = i >= 2 ? x[i - 2]! * 0.8 : 0;
  y.push(lagged + lcg() * 0.3);
}

// Independent pair
const indepX = Array.from({ length: n }, () => lcg());
const indepY = Array.from({ length: n }, () => lcg());

describe("granger-causality", () => {
  describe("grangerCausality", () => {
    it("detects X causes Y", () => {
      const result = grangerCausality(y, x, 5);
      expect(result.reject).toBe(true);
    });

    it("F statistic positive when causality exists", () => {
      const result = grangerCausality(y, x, 5);
      expect(result.fStatistic).toBeGreaterThan(2);
    });

    it("p-value < 0.05 for causal pair", () => {
      const result = grangerCausality(y, x, 5);
      expect(result.pValue).toBeLessThan(0.05);
    });

    it("does not reject for independent series", () => {
      const result = grangerCausality(indepY, indepX, 3);
      expect(result.reject).toBe(false);
    });

    it("p-value > 0.05 for independent series", () => {
      const result = grangerCausality(indepY, indepX, 3);
      expect(result.pValue).toBeGreaterThan(0.05);
    });

    it("returns no causality for short series", () => {
      const result = grangerCausality([1, 2, 3], [4, 5, 6], 2);
      expect(result.reject).toBe(false);
    });
  });

  describe("bidirectionalGranger", () => {
    it("detects one-way causality", () => {
      const result = bidirectionalGranger(x, y, 5);
      expect(result.xCausesY.reject).toBe(true);
    });

    it("no feedback for one-way causal pair", () => {
      const result = bidirectionalGranger(x, y, 5);
      // Y doesn't cause X in general (X is a random walk)
      expect(result.feedback).toBe(false);
    });

    it("no causality for independent pair", () => {
      const result = bidirectionalGranger(indepX, indepY, 3);
      expect(result.feedback).toBe(false);
    });
  });

  describe("selectLagOrder", () => {
    it("selects reasonable lag for causal pair", () => {
      const lag = selectLagOrder(y, x, 10);
      expect(lag).toBeGreaterThanOrEqual(1);
      expect(lag).toBeLessThanOrEqual(10);
    });

    it("returns at least 1", () => {
      const lag = selectLagOrder(indepY, indepX, 5);
      expect(lag).toBeGreaterThanOrEqual(1);
    });
  });
});
