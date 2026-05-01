import { describe, it, expect } from "vitest";
import { computeAwesomeOscillator } from "../../../src/domain/awesome-oscillator";
import type { Candle } from "../../../src/domain/heikin-ashi";

const c = (i: number, p: number): Candle => ({
  time: i,
  open: p,
  high: p + 1,
  low: p - 1,
  close: p,
});

describe("awesome-oscillator", () => {
  it("returns [] when too few candles", () => {
    expect(computeAwesomeOscillator([])).toEqual([]);
    const data = Array.from({ length: 10 }, (_, i) => c(i, i));
    expect(computeAwesomeOscillator(data, 5, 34)).toEqual([]);
  });

  it("rejects invalid periods", () => {
    expect(computeAwesomeOscillator([], 0, 5)).toEqual([]);
    expect(computeAwesomeOscillator([], 5, 5)).toEqual([]);
    expect(computeAwesomeOscillator([], 10, 5)).toEqual([]);
  });

  it("rising trend -> positive AO and green bars", () => {
    const data = Array.from({ length: 40 }, (_, i) => c(i, i));
    const out = computeAwesomeOscillator(data);
    const last = out[out.length - 1]!;
    expect(last.value).toBeGreaterThan(0);
    expect(out.slice(-3).every((p) => p.color === "green" || p.color === "flat")).toBe(true);
  });

  it("falling trend -> negative AO and red bars", () => {
    const data = Array.from({ length: 40 }, (_, i) => c(i, 100 - i));
    const out = computeAwesomeOscillator(data);
    expect(out[out.length - 1]!.value).toBeLessThan(0);
    expect(out.slice(-3).every((p) => p.color === "red" || p.color === "flat")).toBe(true);
  });

  it("constant prices -> AO = 0", () => {
    const data = Array.from({ length: 40 }, (_, i) => c(i, 50));
    for (const p of computeAwesomeOscillator(data)) {
      expect(p.value).toBeCloseTo(0, 6);
    }
  });

  it("first point has flat color (no prior)", () => {
    const data = Array.from({ length: 40 }, (_, i) => c(i, i));
    expect(computeAwesomeOscillator(data)[0]!.color).toBe("flat");
  });

  it("output length = candles - slow + 1", () => {
    const data = Array.from({ length: 50 }, (_, i) => c(i, i));
    expect(computeAwesomeOscillator(data, 5, 34).length).toBe(17);
  });
});
