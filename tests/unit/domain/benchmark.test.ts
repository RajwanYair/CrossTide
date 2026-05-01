import { describe, it, expect } from "vitest";
import {
  rebaseToHundred,
  compareToBenchmark,
  beta,
} from "../../../src/domain/benchmark";

const series = (...pts: [number, number][]): { timestamp: number; value: number }[] =>
  pts.map(([timestamp, value]) => ({ timestamp, value }));

describe("benchmark", () => {
  it("rebaseToHundred starts at 100", () => {
    const r = rebaseToHundred(series([1, 50], [2, 75]));
    expect(r[0]!.value).toBe(100);
    expect(r[1]!.value).toBe(150);
  });

  it("rebaseToHundred handles empty", () => {
    expect(rebaseToHundred([])).toEqual([]);
  });

  it("rebaseToHundred handles zero start", () => {
    const r = rebaseToHundred(series([1, 0], [2, 5]));
    expect(r[0]!.value).toBe(0);
  });

  it("compareToBenchmark aligns by timestamp", () => {
    const r = compareToBenchmark(
      series([1, 100], [2, 110], [3, 120]),
      series([1, 200], [2, 210], [3, 240]),
    );
    expect(r).toHaveLength(3);
    expect(r[0]!.subject).toBe(100);
    expect(r[0]!.benchmark).toBe(100);
    expect(r[2]!.subject).toBe(120);
    expect(r[2]!.benchmark).toBe(120);
    expect(r[2]!.excessPct).toBe(0);
  });

  it("compareToBenchmark drops timestamps without overlap", () => {
    const r = compareToBenchmark(
      series([1, 100], [2, 110]),
      series([2, 200]),
    );
    expect(r).toHaveLength(1);
  });

  it("compareToBenchmark empty when no overlap", () => {
    const r = compareToBenchmark(series([1, 100]), series([2, 100]));
    expect(r).toEqual([]);
  });

  it("compareToBenchmark computes excessPct", () => {
    const r = compareToBenchmark(
      series([1, 100], [2, 120]),
      series([1, 100], [2, 110]),
    );
    expect(r[1]!.excessPct).toBeCloseTo(10, 5);
  });

  it("beta of identical series is 1", () => {
    expect(beta([0.01, 0.02, -0.005], [0.01, 0.02, -0.005])).toBeCloseTo(1, 5);
  });

  it("beta zero when benchmark constant", () => {
    expect(beta([0.01, -0.01, 0.02], [0.01, 0.01, 0.01])).toBe(0);
  });

  it("beta short input returns 0", () => {
    expect(beta([0.01], [0.01])).toBe(0);
  });
});
