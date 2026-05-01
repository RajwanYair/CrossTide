import { describe, it, expect } from "vitest";
import { heikinAshi, type Candle } from "../../../src/domain/heikin-ashi";

const c = (o: number, h: number, l: number, cl: number, t = 0): Candle => ({
  time: t,
  open: o,
  high: h,
  low: l,
  close: cl,
});

describe("heikinAshi", () => {
  it("returns empty for empty input", () => {
    expect(heikinAshi([])).toEqual([]);
  });

  it("first bar haOpen = (O+C)/2", () => {
    const r = heikinAshi([c(10, 12, 9, 11)]);
    expect(r[0]!.haOpen).toBe(10.5);
  });

  it("haClose is the OHLC4 average", () => {
    const r = heikinAshi([c(10, 12, 8, 10)]);
    expect(r[0]!.haClose).toBe(10);
  });

  it("haHigh covers haOpen, haClose, original high", () => {
    const r = heikinAshi([c(10, 20, 5, 15)]);
    expect(r[0]!.haHigh).toBe(20);
  });

  it("haLow covers haOpen, haClose, original low", () => {
    const r = heikinAshi([c(10, 20, 5, 15)]);
    expect(r[0]!.haLow).toBe(5);
  });

  it("subsequent haOpen = avg(prev haOpen, prev haClose)", () => {
    const r = heikinAshi([c(10, 12, 9, 11), c(11, 13, 10, 12)]);
    const expected = (r[0]!.haOpen + r[0]!.haClose) / 2;
    expect(r[1]!.haOpen).toBeCloseTo(expected, 9);
  });

  it("preserves time and volume", () => {
    const input: Candle[] = [{ time: 1000, open: 1, high: 2, low: 0.5, close: 1.5, volume: 500 }];
    const r = heikinAshi(input);
    expect(r[0]!.time).toBe(1000);
    expect(r[0]!.volume).toBe(500);
  });

  it("smooths a trend (consecutive haCloses move monotonically)", () => {
    const trend = [c(10, 11, 10, 11), c(11, 12, 11, 12), c(12, 13, 12, 13), c(13, 14, 13, 14)];
    const r = heikinAshi(trend);
    for (let i = 1; i < r.length; i++) {
      expect(r[i]!.haClose).toBeGreaterThan(r[i - 1]!.haClose);
    }
  });
});
