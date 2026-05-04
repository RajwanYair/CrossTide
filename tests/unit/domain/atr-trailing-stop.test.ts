import { describe, it, expect } from "vitest";
import {
  trueRange,
  atr,
  longTrailingStop,
  shortTrailingStop,
  trailingStopSeries,
} from "../../../src/domain/atr-trailing-stop";

describe("atr-trailing-stop", () => {
  const candles = Array.from({ length: 30 }, (_, i) => ({
    high: 100 + i * 2 + 3,
    low: 100 + i * 2 - 2,
    close: 100 + i * 2,
  }));

  it("trueRange computes max of three measures", () => {
    const tr = trueRange({ high: 105, low: 95, close: 100 }, 98);
    // max(10, |105-98|=7, |95-98|=3) = 10
    expect(tr).toBe(10);
  });

  it("trueRange with gap up", () => {
    const tr = trueRange({ high: 110, low: 105, close: 108 }, 100);
    // max(5, |110-100|=10, |105-100|=5) = 10
    expect(tr).toBe(10);
  });

  it("atr computes average", () => {
    const a = atr(candles, 14);
    expect(a).toBeGreaterThan(0);
  });

  it("atr returns 0 for insufficient data", () => {
    expect(atr(candles.slice(0, 5), 14)).toBe(0);
  });

  it("longTrailingStop below current price", () => {
    const result = longTrailingStop(candles, 3, 14);
    const lastClose = candles[candles.length - 1]!.close;
    expect(result.stopLevel).toBeLessThan(lastClose);
    expect(result.direction).toBe("long");
    expect(result.distance).toBeGreaterThan(0);
  });

  it("longTrailingStop not triggered in uptrend", () => {
    const result = longTrailingStop(candles, 3, 14);
    expect(result.triggered).toBe(false);
  });

  it("shortTrailingStop above current price in downtrend", () => {
    const downCandles = Array.from({ length: 30 }, (_, i) => ({
      high: 200 - i * 2 + 3,
      low: 200 - i * 2 - 2,
      close: 200 - i * 2,
    }));
    const result = shortTrailingStop(downCandles, 3, 14);
    const lastClose = downCandles[downCandles.length - 1]!.close;
    expect(result.stopLevel).toBeGreaterThan(lastClose);
    expect(result.direction).toBe("short");
  });

  it("shortTrailingStop not triggered in downtrend", () => {
    const downCandles = Array.from({ length: 30 }, (_, i) => ({
      high: 200 - i * 2 + 3,
      low: 200 - i * 2 - 2,
      close: 200 - i * 2,
    }));
    const result = shortTrailingStop(downCandles, 3, 14);
    expect(result.triggered).toBe(false);
  });

  it("trailingStopSeries returns correct length", () => {
    const series = trailingStopSeries(candles, "long", 3, 14);
    expect(series).toHaveLength(candles.length);
  });

  it("trailingStopSeries long stops only increase", () => {
    const series = trailingStopSeries(candles, "long", 3, 14);
    for (let i = 1; i < series.length; i++) {
      expect(series[i]!).toBeGreaterThanOrEqual(series[i - 1]!);
    }
  });

  it("insufficient data returns empty/zero", () => {
    const short = candles.slice(0, 5);
    expect(longTrailingStop(short, 3, 14).stopLevel).toBe(0);
    expect(trailingStopSeries(short, "long", 3, 14)).toEqual([]);
  });
});
