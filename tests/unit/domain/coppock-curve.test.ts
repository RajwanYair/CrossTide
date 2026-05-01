import { describe, it, expect } from "vitest";
import { computeCoppockCurve } from "../../../src/domain/coppock-curve";

describe("coppock-curve", () => {
  it("rejects bad params", () => {
    expect(computeCoppockCurve([1, 2, 3], 0)).toEqual([]);
    expect(computeCoppockCurve([1, 2, 3], 14, 0)).toEqual([]);
    expect(computeCoppockCurve([1, 2, 3], 14, 11, 0)).toEqual([]);
  });

  it("nulls until enough history", () => {
    const data = Array.from({ length: 20 }, (_, i) => 100 + i);
    const out = computeCoppockCurve(data);
    // Need longRoc + wmaPeriod -1 = 14+9 = 23 -> all null
    expect(out.every((v) => v === null)).toBe(true);
  });

  it("uptrend -> positive coppock once defined", () => {
    const data = Array.from({ length: 60 }, (_, i) => 100 + i);
    const out = computeCoppockCurve(data);
    const last = out[out.length - 1];
    expect(last).not.toBeNull();
    expect(last!).toBeGreaterThan(0);
  });

  it("downtrend -> negative coppock", () => {
    const data = Array.from({ length: 60 }, (_, i) => 200 - i);
    const out = computeCoppockCurve(data);
    expect(out[out.length - 1]!).toBeLessThan(0);
  });

  it("flat series -> coppock = 0", () => {
    const data = Array.from({ length: 60 }, () => 100);
    const out = computeCoppockCurve(data);
    expect(out[out.length - 1]!).toBeCloseTo(0, 6);
  });

  it("output length equals input", () => {
    const data = Array.from({ length: 60 }, (_, i) => i + 1);
    expect(computeCoppockCurve(data).length).toBe(60);
  });
});
