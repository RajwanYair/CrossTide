import { describe, it, expect } from "vitest";
import { computeVortex } from "../../../src/domain/vortex-indicator";
import type { Candle } from "../../../src/domain/heikin-ashi";

const c = (i: number, o: number, h: number, l: number, cl: number): Candle => ({
  time: i, open: o, high: h, low: l, close: cl,
});

describe("vortex-indicator", () => {
  it("rejects bad period / too short", () => {
    expect(computeVortex([], 14)).toEqual([]);
    expect(computeVortex([c(0, 1, 1, 1, 1)], 14)).toEqual([]);
    expect(computeVortex([c(0, 1, 1, 1, 1), c(1, 2, 2, 2, 2)], 0)).toEqual([]);
  });

  it("uptrend -> VI+ > VI-", () => {
    const data: Candle[] = [];
    for (let i = 0; i < 30; i++) {
      const base = 100 + i;
      data.push(c(i, base, base + 1, base - 0.5, base + 0.5));
    }
    const out = computeVortex(data, 14);
    expect(out[out.length - 1]!.viPlus).toBeGreaterThan(out[out.length - 1]!.viMinus);
  });

  it("downtrend -> VI- > VI+", () => {
    const data: Candle[] = [];
    for (let i = 0; i < 30; i++) {
      const base = 200 - i;
      data.push(c(i, base, base + 0.5, base - 1, base - 0.5));
    }
    const out = computeVortex(data, 14);
    expect(out[out.length - 1]!.viMinus).toBeGreaterThan(out[out.length - 1]!.viPlus);
  });

  it("output length = candles - period", () => {
    const data = Array.from({ length: 30 }, (_, i) => c(i, i, i + 1, i - 1, i));
    expect(computeVortex(data, 14).length).toBe(16);
  });

  it("VI values are non-negative", () => {
    const data = Array.from({ length: 50 }, (_, i) =>
      c(i, 100, 100 + Math.sin(i) + 1, 100 + Math.sin(i) - 1, 100 + Math.sin(i)),
    );
    const out = computeVortex(data, 14);
    for (const p of out) {
      expect(p.viPlus).toBeGreaterThanOrEqual(0);
      expect(p.viMinus).toBeGreaterThanOrEqual(0);
    }
  });

  it("uses provided times", () => {
    const data = Array.from({ length: 20 }, (_, i) => c(i * 1000, 1, 2, 0, 1));
    const out = computeVortex(data, 14);
    expect(out[0]!.time).toBe(14000);
  });
});
