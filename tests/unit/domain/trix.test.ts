import { describe, it, expect } from "vitest";
import { computeTrix } from "../../../src/domain/trix";
import type { Candle } from "../../../src/domain/heikin-ashi";

const c = (i: number, close: number): Candle => ({
  time: i,
  open: close,
  high: close,
  low: close,
  close,
});

describe("trix", () => {
  it("empty / too-short -> []", () => {
    expect(computeTrix([])).toEqual([]);
    expect(
      computeTrix(
        Array.from({ length: 10 }, (_, i) => c(i, i)),
        15,
      ),
    ).toEqual([]);
  });

  it("constant series -> trix = 0", () => {
    const data = Array.from({ length: 80 }, (_, i) => c(i, 100));
    const out = computeTrix(data, 5);
    expect(out.length).toBeGreaterThan(0);
    for (const p of out) expect(p.trix).toBeCloseTo(0, 6);
  });

  it("rising series -> positive trix at end", () => {
    const data = Array.from({ length: 80 }, (_, i) => c(i, 100 + i));
    const out = computeTrix(data, 5);
    expect(out[out.length - 1]!.trix).toBeGreaterThan(0);
  });

  it("falling series -> negative trix at end", () => {
    const data = Array.from({ length: 80 }, (_, i) => c(i, 200 - i));
    const out = computeTrix(data, 5);
    expect(out[out.length - 1]!.trix).toBeLessThan(0);
  });

  it("signal line eventually populated", () => {
    const data = Array.from({ length: 100 }, (_, i) => c(i, 50 + Math.sin(i / 5) * 10));
    const out = computeTrix(data, 5, 3);
    expect(out.some((p) => p.signal !== null)).toBe(true);
  });

  it("rejects period <= 0", () => {
    const data = Array.from({ length: 50 }, (_, i) => c(i, i));
    expect(computeTrix(data, 0)).toEqual([]);
  });
});
