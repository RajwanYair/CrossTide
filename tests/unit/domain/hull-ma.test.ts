import { describe, it, expect } from "vitest";
import { computeHullMA } from "../../../src/domain/hull-ma";

describe("hull-ma", () => {
  it("rejects period <= 1", () => {
    expect(computeHullMA([1, 2, 3], 0).every((v) => v === null)).toBe(true);
    expect(computeHullMA([1, 2, 3], 1).every((v) => v === null)).toBe(true);
  });

  it("constant series -> equals constant once defined", () => {
    const data = Array.from({ length: 50 }, () => 100);
    const out = computeHullMA(data, 16);
    expect(out[out.length - 1]!).toBeCloseTo(100, 6);
  });

  it("linear ramp -> HMA tracks current value closely (low lag)", () => {
    const data = Array.from({ length: 60 }, (_, i) => i);
    const out = computeHullMA(data, 16);
    // last data value = 59; HMA is roughly an unbiased estimator on linear data.
    expect(out[out.length - 1]!).toBeGreaterThan(57);
    expect(out[out.length - 1]!).toBeLessThan(61);
  });

  it("output length matches input", () => {
    const data = Array.from({ length: 40 }, (_, i) => i);
    expect(computeHullMA(data, 9).length).toBe(40);
  });

  it("nulls in early bars", () => {
    const data = Array.from({ length: 40 }, (_, i) => i);
    expect(computeHullMA(data, 9)[0]).toBeNull();
  });

  it("reacts to direction change faster than half-period would", () => {
    const data = [
      ...Array.from({ length: 30 }, (_, i) => 100 - i),
      ...Array.from({ length: 20 }, (_, i) => 70 + i),
    ];
    const out = computeHullMA(data, 9);
    const last = out[out.length - 1]!;
    expect(last).toBeGreaterThan(out[out.length - 5]!);
  });
});
