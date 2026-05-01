import { describe, it, expect } from "vitest";
import { computeAdLine, type AdCandle } from "../../../src/domain/ad-line";

const mk = (h: number, l: number, c: number, v: number): AdCandle => ({
  high: h,
  low: l,
  close: c,
  volume: v,
});

describe("ad-line", () => {
  it("empty -> []", () => {
    expect(computeAdLine([])).toEqual([]);
  });

  it("close at high -> MFM = 1 -> AD increases by volume", () => {
    const out = computeAdLine([mk(10, 5, 10, 1000), mk(12, 6, 12, 500)]);
    expect(out[0]).toBeCloseTo(1000, 9);
    expect(out[1]).toBeCloseTo(1500, 9);
  });

  it("close at low -> MFM = -1 -> AD decreases by volume", () => {
    const out = computeAdLine([mk(10, 5, 5, 1000), mk(8, 4, 4, 200)]);
    expect(out[0]).toBeCloseTo(-1000, 9);
    expect(out[1]).toBeCloseTo(-1200, 9);
  });

  it("close in middle -> MFM = 0", () => {
    const out = computeAdLine([mk(10, 0, 5, 1000)]);
    expect(out[0]).toBeCloseTo(0, 9);
  });

  it("zero range candle -> contributes 0", () => {
    const out = computeAdLine([mk(5, 5, 5, 9999)]);
    expect(out[0]).toBe(0);
  });

  it("output length equals input", () => {
    const candles = Array.from({ length: 20 }, (_, i) => mk(i + 2, i, i + 1, 100));
    expect(computeAdLine(candles).length).toBe(20);
  });

  it("monotonic accumulation when always closing at high", () => {
    const candles = Array.from({ length: 10 }, (_, i) => mk(i + 2, i, i + 2, 100));
    const out = computeAdLine(candles);
    for (let i = 1; i < out.length; i++) expect(out[i]!).toBeGreaterThan(out[i - 1]!);
  });
});
