import { describe, it, expect } from "vitest";
import {
  vwap,
  runningVwap,
  vwapWithBands,
  twap,
  simpleTwap,
  vwapDeviation,
} from "../../../src/domain/vwap";

describe("vwap", () => {
  const bars = [
    { price: 100, volume: 1000 },
    { price: 102, volume: 2000 },
    { price: 101, volume: 1500 },
  ];

  it("vwap computes volume-weighted average", () => {
    // (100*1000 + 102*2000 + 101*1500) / (1000+2000+1500)
    // = (100000 + 204000 + 151500) / 4500 = 455500/4500 ≈ 101.222
    const v = vwap(bars);
    expect(v).toBeCloseTo(101.222, 2);
  });

  it("vwap returns 0 for empty", () => {
    expect(vwap([])).toBe(0);
  });

  it("runningVwap produces cumulative series", () => {
    const series = runningVwap(bars);
    expect(series).toHaveLength(3);
    expect(series[0]).toBe(100); // just first bar
    // After 2 bars: (100*1000 + 102*2000) / 3000 = 304000/3000
    expect(series[1]).toBeCloseTo(101.333, 2);
    expect(series[2]).toBeCloseTo(101.222, 2);
  });

  it("vwapWithBands provides upper/lower", () => {
    const result = vwapWithBands(bars);
    expect(result.vwap).toBeCloseTo(101.222, 2);
    expect(result.upperBand).toBeGreaterThan(result.vwap);
    expect(result.lowerBand).toBeLessThan(result.vwap);
    expect(result.cumulativeVolume).toBe(4500);
  });

  it("vwapWithBands returns zeros for empty", () => {
    const result = vwapWithBands([]);
    expect(result.vwap).toBe(0);
    expect(result.upperBand).toBe(0);
  });

  it("twap computes time-weighted average", () => {
    const prices = [
      { price: 100, timestamp: 0 },
      { price: 110, timestamp: 1000 },
      { price: 105, timestamp: 2000 },
    ];
    // Time-weighted: (100*1000 + 110*1000) / 2000 = 105
    const t = twap(prices);
    expect(t).toBe(105);
  });

  it("twap single price returns that price", () => {
    expect(twap([{ price: 50, timestamp: 0 }])).toBe(50);
  });

  it("twap empty returns 0", () => {
    expect(twap([])).toBe(0);
  });

  it("simpleTwap averages equally", () => {
    expect(simpleTwap([100, 110, 105])).toBeCloseTo(105, 2);
  });

  it("simpleTwap empty returns 0", () => {
    expect(simpleTwap([])).toBe(0);
  });

  it("vwapDeviation measures distance from vwap", () => {
    const dev = vwapDeviation(103, bars);
    // vwap ≈ 101.222, dev = (103-101.222)/101.222 * 100 ≈ 1.756%
    expect(dev).toBeCloseTo(1.756, 1);
  });

  it("vwapDeviation returns 0 for empty bars", () => {
    expect(vwapDeviation(100, [])).toBe(0);
  });
});
