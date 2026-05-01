import { describe, it, expect } from "vitest";
import { computeUltimateOscillator } from "../../../src/domain/ultimate-oscillator";
import type { Candle } from "../../../src/domain/heikin-ashi";

function makeCandles(closes: number[]): Candle[] {
  return closes.map((c, i) => ({ time: i, open: c, high: c + 1, low: c - 1, close: c }));
}

describe("computeUltimateOscillator", () => {
  it("returns nulls for first long-1 bars", () => {
    const out = computeUltimateOscillator(makeCandles([1, 2, 3, 4]));
    expect(out.every((v) => v === null)).toBe(true);
  });
  it("computes a value at index >= long with default windows", () => {
    const closes = Array.from({ length: 40 }, (_, i) => 100 + Math.sin(i / 3) * 5);
    const out = computeUltimateOscillator(makeCandles(closes));
    expect(out[28]).not.toBeNull();
    expect(out[28]!).toBeGreaterThanOrEqual(0);
    expect(out[28]!).toBeLessThanOrEqual(100);
  });
  it("respects custom periods", () => {
    const closes = Array.from({ length: 30 }, (_, i) => 50 + i);
    const out = computeUltimateOscillator(makeCandles(closes), { short: 3, medium: 5, long: 10 });
    expect(out[10]).not.toBeNull();
  });
  it("trending up gives high oscillator (>50)", () => {
    const closes = Array.from({ length: 35 }, (_, i) => 10 + i * 2);
    const out = computeUltimateOscillator(makeCandles(closes));
    expect(out[30]!).toBeGreaterThan(50);
  });
  it("empty input -> empty output", () => {
    expect(computeUltimateOscillator([])).toEqual([]);
  });
});
