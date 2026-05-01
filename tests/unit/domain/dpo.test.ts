import { describe, it, expect } from "vitest";
import { computeDpo } from "../../../src/domain/dpo";

describe("dpo", () => {
  it("rejects bad params", () => {
    expect(computeDpo([])).toEqual([]);
    expect(computeDpo([1, 2, 3], 0).every((v) => v === null)).toBe(true);
    expect(computeDpo([1, 2, 3], 20).every((v) => v === null)).toBe(true);
  });

  it("constant series -> DPO = 0 once defined", () => {
    const out = computeDpo(
      Array.from({ length: 40 }, () => 100),
      10,
    );
    const defined = out.filter((v) => v !== null) as number[];
    expect(defined.length).toBeGreaterThan(0);
    for (const v of defined) expect(v).toBeCloseTo(0, 9);
  });

  it("output length equals input", () => {
    expect(
      computeDpo(
        Array.from({ length: 50 }, (_, i) => i + 1),
        10,
      ).length,
    ).toBe(50);
  });

  it("linear ramp -> DPO equals constant offset (period dependent)", () => {
    const data = Array.from({ length: 60 }, (_, i) => i);
    const out = computeDpo(data, 10);
    // For pure linear data, DPO at any defined i is constant.
    const defined = out.filter((v) => v !== null) as number[];
    for (let i = 1; i < defined.length; i++) {
      expect(defined[i]!).toBeCloseTo(defined[0]!, 9);
    }
  });

  it("oscillation -> DPO follows the cycle (sign matches deviation)", () => {
    const data = Array.from({ length: 80 }, (_, i) => 100 + Math.sin(i / 4) * 5);
    const out = computeDpo(data, 10);
    expect(out.some((v) => v !== null && v > 0)).toBe(true);
    expect(out.some((v) => v !== null && v < 0)).toBe(true);
  });
});
