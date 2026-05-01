import { describe, it, expect } from "vitest";
import { computeMassIndex } from "../../../src/domain/mass-index";
import type { Candle } from "../../../src/domain/heikin-ashi";

const c = (i: number, h: number, l: number): Candle => ({
  time: i, open: l, high: h, low: l, close: l,
});

describe("mass-index", () => {
  it("rejects bad params", () => {
    expect(computeMassIndex([], 9, 25).length).toBe(0);
    const data = Array.from({ length: 50 }, (_, i) => c(i, 100, 99));
    expect(computeMassIndex(data, 0).every((v) => v === null)).toBe(true);
    expect(computeMassIndex(data, 9, 0).every((v) => v === null)).toBe(true);
  });

  it("nulls until enough history", () => {
    const data = Array.from({ length: 30 }, (_, i) => c(i, 100, 99));
    const out = computeMassIndex(data, 9, 25);
    expect(out.slice(0, 25).every((v) => v === null)).toBe(true);
  });

  it("constant range -> MI ~ sumPeriod (ratio = 1)", () => {
    const data = Array.from({ length: 60 }, (_, i) => c(i, 100, 99));
    const out = computeMassIndex(data, 9, 25);
    const last = out[out.length - 1]!;
    expect(last).toBeCloseTo(25, 6);
  });

  it("expanding range -> MI rises above sumPeriod", () => {
    const data: Candle[] = [];
    for (let i = 0; i < 60; i++) {
      const range = 1 + i * 0.05;
      data.push(c(i, 100 + range, 100 - range));
    }
    const out = computeMassIndex(data, 9, 25);
    const last = out[out.length - 1]!;
    expect(last).toBeGreaterThan(25);
  });

  it("output length equals input", () => {
    const data = Array.from({ length: 60 }, (_, i) => c(i, 100, 99));
    expect(computeMassIndex(data, 9, 25).length).toBe(60);
  });
});
