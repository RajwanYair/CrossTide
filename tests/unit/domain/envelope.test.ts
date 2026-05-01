import { describe, it, expect } from "vitest";
import { computeEnvelope } from "../../../src/domain/envelope";

describe("envelope", () => {
  it("rejects bad params / too short", () => {
    expect(computeEnvelope([], 5)).toEqual([]);
    expect(computeEnvelope([1, 2, 3], 5)).toEqual([]);
    expect(computeEnvelope([1, 2, 3], 0)).toEqual([]);
    expect(computeEnvelope([1, 2, 3], 2, -1)).toEqual([]);
  });

  it("constant series -> bands wrap the price", () => {
    const out = computeEnvelope([100, 100, 100, 100, 100], 3, 2);
    expect(out.length).toBe(3);
    for (const p of out) {
      expect(p.middle).toBe(100);
      expect(p.upper).toBeCloseTo(102, 9);
      expect(p.lower).toBeCloseTo(98, 9);
    }
  });

  it("upper > middle > lower", () => {
    const out = computeEnvelope([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5, 5);
    for (const p of out) {
      expect(p.upper).toBeGreaterThan(p.middle);
      expect(p.lower).toBeLessThan(p.middle);
    }
  });

  it("percent=0 collapses bands to middle", () => {
    const out = computeEnvelope([1, 2, 3, 4, 5], 3, 0);
    for (const p of out) {
      expect(p.upper).toBeCloseTo(p.middle, 9);
      expect(p.lower).toBeCloseTo(p.middle, 9);
    }
  });

  it("first point has index = period - 1", () => {
    const out = computeEnvelope([1, 2, 3, 4, 5, 6], 4);
    expect(out[0]!.index).toBe(3);
  });
});
