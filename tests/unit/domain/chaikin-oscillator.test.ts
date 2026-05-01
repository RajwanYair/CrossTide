import { describe, it, expect } from "vitest";
import { computeChaikinOscillator } from "../../../src/domain/chaikin-oscillator";
import type { AdCandle } from "../../../src/domain/ad-line";

const mk = (h: number, l: number, c: number, v: number): AdCandle => ({ high: h, low: l, close: c, volume: v });

describe("chaikin-oscillator", () => {
  it("empty / too short -> all null", () => {
    expect(computeChaikinOscillator([], 3, 10)).toEqual([]);
    const candles = Array.from({ length: 5 }, (_, i) => mk(i + 2, i, i + 1, 100));
    expect(computeChaikinOscillator(candles, 3, 10).every((v) => v === null)).toBe(true);
  });

  it("rejects bad params", () => {
    const candles = Array.from({ length: 20 }, (_, i) => mk(i + 2, i, i + 1, 100));
    expect(computeChaikinOscillator(candles, 0, 10).every((v) => v === null)).toBe(true);
    expect(computeChaikinOscillator(candles, 3, 0).every((v) => v === null)).toBe(true);
  });

  it("output length matches input", () => {
    const candles = Array.from({ length: 30 }, (_, i) => mk(i + 2, i, i + 1, 100));
    expect(computeChaikinOscillator(candles).length).toBe(30);
  });

  it("strong accumulation (close at high) -> positive oscillator", () => {
    const candles = Array.from({ length: 30 }, (_, i) => mk(i + 2, i, i + 2, 1000));
    const out = computeChaikinOscillator(candles);
    expect(out[out.length - 1]!).toBeGreaterThan(0);
  });

  it("strong distribution (close at low) -> negative oscillator", () => {
    const candles = Array.from({ length: 30 }, (_, i) => mk(i + 2, i, i, 1000));
    const out = computeChaikinOscillator(candles);
    expect(out[out.length - 1]!).toBeLessThan(0);
  });
});
