import { describe, it, expect } from "vitest";
import { resampleCandles, TIMEFRAMES } from "../../../src/domain/resample";
import type { Candle } from "../../../src/domain/heikin-ashi";

const mk = (
  t: number,
  o: number,
  h: number,
  l: number,
  c: number,
  v?: number,
): Candle => ({ time: t, open: o, high: h, low: l, close: c, volume: v });

describe("resample", () => {
  it("rejects bad interval", () => {
    expect(() => resampleCandles([], { intervalMs: 0 })).toThrow(RangeError);
    expect(() => resampleCandles([], { intervalMs: NaN })).toThrow(RangeError);
  });

  it("returns empty for empty input", () => {
    expect(resampleCandles([], { intervalMs: TIMEFRAMES.m5 })).toEqual([]);
  });

  it("five 1-minute bars collapse to one 5-minute bar", () => {
    const minute = 60_000;
    const cs: Candle[] = [
      mk(0, 10, 12, 9, 11, 100),
      mk(minute, 11, 14, 10, 13, 200),
      mk(2 * minute, 13, 13, 11, 12, 50),
      mk(3 * minute, 12, 15, 11, 14, 75),
      mk(4 * minute, 14, 14, 13, 13, 25),
    ];
    const out = resampleCandles(cs, { intervalMs: 5 * minute });
    expect(out).toHaveLength(1);
    expect(out[0]!.open).toBe(10);
    expect(out[0]!.high).toBe(15);
    expect(out[0]!.low).toBe(9);
    expect(out[0]!.close).toBe(13);
    expect(out[0]!.volume).toBe(450);
    expect(out[0]!.time).toBe(0);
  });

  it("creates a new bucket when interval rolls over", () => {
    const minute = 60_000;
    const cs: Candle[] = [
      mk(0, 10, 11, 9, 10),
      mk(4 * minute, 11, 12, 10, 11),
      mk(5 * minute, 12, 13, 11, 12),
      mk(9 * minute, 12, 14, 11, 13),
    ];
    const out = resampleCandles(cs, { intervalMs: 5 * minute });
    expect(out).toHaveLength(2);
    expect(out[0]!.time).toBe(0);
    expect(out[1]!.time).toBe(5 * minute);
  });

  it("omits volume field when source has no volume", () => {
    const cs: Candle[] = [mk(0, 1, 2, 0, 1.5), mk(60_000, 1.5, 2.5, 1, 2)];
    const out = resampleCandles(cs, { intervalMs: 5 * 60_000 });
    expect(out[0]!.volume).toBeUndefined();
  });

  it("buckets align to interval boundaries (not first candle time)", () => {
    const minute = 60_000;
    const cs: Candle[] = [
      mk(7 * minute, 10, 11, 9, 10),
      mk(8 * minute, 10, 11, 9, 11),
    ];
    const out = resampleCandles(cs, { intervalMs: 5 * minute });
    // Both fall into bucket starting at 5m.
    expect(out[0]!.time).toBe(5 * minute);
  });

  it("supports daily timeframe constants", () => {
    expect(TIMEFRAMES.d1).toBe(86_400_000);
    expect(TIMEFRAMES.h1).toBe(3_600_000);
  });
});
