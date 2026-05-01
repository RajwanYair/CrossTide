import { describe, it, expect } from "vitest";
import { percentile, percentRank, rollingPercentRank } from "../../../src/domain/percentile-rank";

describe("percentile-rank", () => {
  it("percentile empty -> null", () => {
    expect(percentile([], 50)).toBeNull();
  });

  it("percentile basic", () => {
    expect(percentile([1, 2, 3, 4, 5], 0)).toBe(1);
    expect(percentile([1, 2, 3, 4, 5], 100)).toBe(5);
    expect(percentile([1, 2, 3, 4, 5], 50)).toBe(3);
    expect(percentile([1, 2, 3, 4], 50)).toBeCloseTo(2.5, 6);
  });

  it("percentile clamps p", () => {
    expect(percentile([1, 2, 3], -10)).toBe(1);
    expect(percentile([1, 2, 3], 999)).toBe(3);
  });

  it("percentRank empty -> null", () => {
    expect(percentRank([], 5)).toBeNull();
  });

  it("percentRank counts <= target", () => {
    expect(percentRank([1, 2, 3, 4, 5], 3)).toBe(60);
    expect(percentRank([1, 2, 3, 4, 5], 0)).toBe(0);
    expect(percentRank([1, 2, 3, 4, 5], 999)).toBe(100);
  });

  it("rollingPercentRank: leading nulls then bounded values", () => {
    const out = rollingPercentRank([1, 2, 3, 4, 5], 3);
    expect(out[0]).toBeNull();
    expect(out[1]).toBeNull();
    expect(out[2]).toBe(100); // 3 is highest in [1,2,3]
    expect(out[3]).toBe(100);
    expect(out[4]).toBe(100);
  });

  it("rollingPercentRank: lowest in window -> 100/window", () => {
    const out = rollingPercentRank([5, 4, 3], 3);
    // last value 3 is lowest -> only itself <= 3 -> 1/3 * 100
    expect(out[2]).toBeCloseTo(100 / 3, 6);
  });

  it("rollingPercentRank: window 0 -> all null", () => {
    expect(rollingPercentRank([1, 2, 3], 0).every((v) => v === null)).toBe(true);
  });
});
