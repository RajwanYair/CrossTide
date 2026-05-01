import { describe, it, expect } from "vitest";
import { computeKeltner } from "../../../src/domain/keltner";
import type { Candle } from "../../../src/domain/heikin-ashi";

const mk = (close: number, hi: number, lo: number, t = 0): Candle => ({
  time: t,
  open: close,
  high: hi,
  low: lo,
  close,
});

const flat = (n: number): Candle[] => Array.from({ length: n }, (_, i) => mk(100, 101, 99, i));

describe("keltner", () => {
  it("rejects invalid length", () => {
    expect(() => computeKeltner([], { length: 0 })).toThrow(RangeError);
    expect(() => computeKeltner([], { atrLength: -1 })).toThrow(RangeError);
  });

  it("returns empty when candles too few", () => {
    expect(computeKeltner(flat(5))).toEqual([]);
  });

  it("flat market: middle ≈ price, bands narrow", () => {
    const r = computeKeltner(flat(40));
    expect(r.length).toBeGreaterThan(0);
    const p = r[r.length - 1]!;
    expect(p.middle).toBeCloseTo(100, 5);
    expect(p.upper - p.lower).toBeCloseTo(2 * 2 * 2, 1); // mult * 2 * range≈2
  });

  it("upper >= middle >= lower", () => {
    const candles = Array.from({ length: 30 }, (_, i) =>
      mk(100 + i * 0.5, 101 + i * 0.5, 99 + i * 0.5, i),
    );
    for (const p of computeKeltner(candles)) {
      expect(p.upper).toBeGreaterThanOrEqual(p.middle);
      expect(p.middle).toBeGreaterThanOrEqual(p.lower);
    }
  });

  it("multiplier widens bands proportionally", () => {
    const r1 = computeKeltner(flat(40), { multiplier: 1 });
    const r2 = computeKeltner(flat(40), { multiplier: 4 });
    const w1 = r1[r1.length - 1]!.upper - r1[r1.length - 1]!.lower;
    const w2 = r2[r2.length - 1]!.upper - r2[r2.length - 1]!.lower;
    expect(w2).toBeCloseTo(w1 * 4, 5);
  });

  it("preserves time of trailing candles", () => {
    const candles = flat(40);
    const r = computeKeltner(candles);
    expect(r[r.length - 1]!.time).toBe(39);
  });
});
