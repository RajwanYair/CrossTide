import { describe, it, expect } from "vitest";
import { computeKama } from "../../../src/domain/kama";

describe("computeKama", () => {
  it("empty -> empty", () => {
    expect(computeKama([])).toEqual([]);
  });
  it("returns nulls when too few values", () => {
    const out = computeKama([1, 2, 3, 4], { period: 10 });
    expect(out.every((v) => v === null)).toBe(true);
  });
  it("seeds with SMA at index period-1", () => {
    const vals = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const out = computeKama(vals, { period: 5 });
    expect(out[4]).toBeCloseTo(3, 6); // SMA(1..5)
    expect(out[5]).not.toBeNull();
  });
  it("constant input -> KAMA equals constant after seed", () => {
    const vals = Array.from({ length: 20 }, () => 50);
    const out = computeKama(vals, { period: 5 });
    for (let i = 4; i < 20; i++) expect(out[i]).toBeCloseTo(50, 6);
  });
  it("trending input -> KAMA tracks values closely", () => {
    const vals = Array.from({ length: 30 }, (_, i) => 100 + i);
    const out = computeKama(vals, { period: 5 });
    expect(Math.abs(out[25]! - vals[25]!)).toBeLessThan(5);
  });
  it("custom fast/slow", () => {
    const vals = Array.from({ length: 20 }, (_, i) => 10 + i);
    const out = computeKama(vals, { period: 5, fast: 3, slow: 20 });
    expect(out[10]).not.toBeNull();
  });
});
