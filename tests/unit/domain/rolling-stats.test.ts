import { describe, it, expect } from "vitest";
import {
  rollingMean,
  rollingStdDev,
  rollingMin,
  rollingMax,
  rollingZScore,
} from "../../../src/domain/rolling-stats";

describe("rolling-stats", () => {
  it("rollingMean sliding window", () => {
    expect(rollingMean([1, 2, 3, 4, 5], 3)).toEqual([2, 3, 4]);
  });

  it("rollingStdDev (sample) of constant series is 0", () => {
    expect(rollingStdDev([5, 5, 5, 5], 3)).toEqual([0, 0]);
  });

  it("rollingStdDev matches formula", () => {
    const out = rollingStdDev([2, 4, 4, 4, 5, 5, 7, 9], 4);
    // First window [2,4,4,4]: mean=3.5, sample sd ≈ 1
    expect(out[0]).toBeCloseTo(1, 4);
  });

  it("rollingMin / rollingMax sliding", () => {
    expect(rollingMin([5, 1, 3, 2, 4], 3)).toEqual([1, 1, 2]);
    expect(rollingMax([5, 1, 3, 2, 4], 3)).toEqual([5, 3, 4]);
  });

  it("rollingZScore: last value 1 sigma above mean -> ~1", () => {
    const z = rollingZScore([1, 2, 3, 4, 5], 5);
    // mean=3, sample sd = sqrt(2.5) ≈ 1.58, z = (5-3)/1.58 ≈ 1.265
    expect(z[0]).toBeCloseTo(1.265, 2);
  });

  it("returns [] when window > length or invalid", () => {
    expect(rollingMean([1, 2], 5)).toEqual([]);
    expect(rollingStdDev([1, 2], 1)).toEqual([]); // window must be > 1
    expect(rollingMin([], 3)).toEqual([]);
    expect(rollingMax([1], 0)).toEqual([]);
  });

  it("output length = values - window + 1", () => {
    expect(rollingMean(Array(10).fill(1), 3).length).toBe(8);
    expect(rollingStdDev(Array(10).fill(1), 3).length).toBe(8);
  });

  it("z-score yields 0 for flat windows", () => {
    expect(rollingZScore([3, 3, 3, 3, 3], 3)).toEqual([0, 0, 0]);
  });
});
