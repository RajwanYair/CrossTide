import { describe, it, expect } from "vitest";
import { computeRangeBar, rangeFromCandles } from "../../../src/ui/range-bar";

describe("range-bar", () => {
  it("midpoint maps to 0.5", () => {
    expect(computeRangeBar({ low: 0, high: 100, current: 50 }).position).toBe(0.5);
  });

  it("low maps to 0, high maps to 1", () => {
    expect(computeRangeBar({ low: 10, high: 20, current: 10 }).position).toBe(0);
    expect(computeRangeBar({ low: 10, high: 20, current: 20 }).position).toBe(1);
  });

  it("clamps below range and reports zone", () => {
    const r = computeRangeBar({ low: 10, high: 20, current: 5 });
    expect(r.position).toBe(0);
    expect(r.zone).toBe("below");
  });

  it("clamps above range and reports zone", () => {
    const r = computeRangeBar({ low: 10, high: 20, current: 30 });
    expect(r.position).toBe(1);
    expect(r.zone).toBe("above");
  });

  it("zero range returns midpoint", () => {
    expect(computeRangeBar({ low: 5, high: 5, current: 5 }).position).toBe(0.5);
  });

  it("non-finite returns midpoint defaults", () => {
    const r = computeRangeBar({ low: NaN, high: 5, current: 1 });
    expect(r.position).toBe(0);
  });

  it("computes fromLowPct/fromHighPct", () => {
    const r = computeRangeBar({ low: 100, high: 200, current: 150 });
    expect(r.fromLowPct).toBe(50);
    expect(r.fromHighPct).toBe(25);
  });

  it("rangeFromCandles spans all bars", () => {
    const r = rangeFromCandles([
      { low: 5, high: 15, close: 10 },
      { low: 8, high: 20, close: 18 },
    ]);
    expect(r).toEqual({ low: 5, high: 20, current: 18 });
  });

  it("rangeFromCandles empty returns null", () => {
    expect(rangeFromCandles([])).toBeNull();
  });
});
