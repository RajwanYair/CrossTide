import { describe, it, expect } from "vitest";
import { computeFractals } from "../../../src/domain/fractals";
import type { Candle } from "../../../src/domain/heikin-ashi";

const mk = (t: number, h: number, l: number): Candle => ({ time: t, open: l, high: h, low: l, close: h });

describe("fractals", () => {
  it("rejects bad params / too short", () => {
    expect(computeFractals([])).toEqual([]);
    expect(computeFractals([mk(1, 5, 4)])).toEqual([]);
    expect(computeFractals([mk(1, 5, 4), mk(2, 5, 4), mk(3, 5, 4)], 0)).toEqual([]);
  });

  it("detects classic bearish fractal at peak (5-bar)", () => {
    const c = [mk(1, 1, 0), mk(2, 2, 1), mk(3, 5, 4), mk(4, 2, 1), mk(5, 1, 0)];
    const out = computeFractals(c, 2);
    expect(out.find((p) => p.type === "bearish")?.index).toBe(2);
  });

  it("detects classic bullish fractal at trough", () => {
    const c = [mk(1, 5, 4), mk(2, 4, 3), mk(3, 2, 1), mk(4, 4, 3), mk(5, 5, 4)];
    const out = computeFractals(c, 2);
    expect(out.find((p) => p.type === "bullish")?.index).toBe(2);
  });

  it("monotonic uptrend has no fractals in interior", () => {
    const c = Array.from({ length: 9 }, (_, i) => mk(i, i + 1, i));
    const out = computeFractals(c, 2);
    expect(out).toEqual([]);
  });

  it("custom n widens window", () => {
    // For n=3 (7-bar pattern) center bar must be highest of 3 each side.
    const c = [mk(0, 1, 0), mk(1, 2, 1), mk(2, 3, 2), mk(3, 9, 8), mk(4, 3, 2), mk(5, 2, 1), mk(6, 1, 0)];
    const out = computeFractals(c, 3);
    expect(out[0]?.index).toBe(3);
    expect(out[0]?.type).toBe("bearish");
  });
});
