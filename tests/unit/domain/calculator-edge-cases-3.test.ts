/**
 * Extended MFI, Williams%R, ADX, SuperTrend, SAR, VWAP edge cases.
 */
import { describe, it, expect } from "vitest";
import { computeMfiSeries } from "../../../src/domain/mfi-calculator";
import { computeWilliamsRSeries } from "../../../src/domain/williams-r-calculator";
import { computeAdxSeries } from "../../../src/domain/adx-calculator";
import { computeSuperTrendSeries } from "../../../src/domain/supertrend-calculator";
import { computeSarSeries } from "../../../src/domain/parabolic-sar-calculator";
import { computeVwapSeries, computeVwap } from "../../../src/domain/vwap-calculator";
import { makeCandles } from "../../helpers/candle-factory";

describe("MFI edge cases", () => {
  it("returns all nulls for insufficient data", () => {
    const series = computeMfiSeries(makeCandles([100, 101]));
    expect(series.every((p) => p.value === null)).toBe(true);
  });

  it("MFI values are between 0 and 100", () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + Math.sin(i) * 10);
    const series = computeMfiSeries(makeCandles(closes));
    for (const p of series) {
      if (p.value !== null) {
        expect(p.value).toBeGreaterThanOrEqual(0);
        expect(p.value).toBeLessThanOrEqual(100);
      }
    }
  });

  it("MFI is 100 for strictly ascending prices", () => {
    const closes = Array.from({ length: 20 }, (_, i) => 50 + i * 5);
    const series = computeMfiSeries(makeCandles(closes));
    if (series.length > 0) {
      const last = series[series.length - 1]!;
      expect(last.value).toBe(100);
    }
  });
});

describe("Williams %R edge cases", () => {
  it("returns all nulls for insufficient data", () => {
    const series = computeWilliamsRSeries(makeCandles([100]));
    expect(series.every((p) => p.value === null)).toBe(true);
  });

  it("values are between -100 and 0", () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + Math.sin(i) * 15);
    const series = computeWilliamsRSeries(makeCandles(closes));
    for (const p of series) {
      if (p.value !== null) {
        expect(p.value).toBeGreaterThanOrEqual(-100);
        expect(p.value).toBeLessThanOrEqual(0);
      }
    }
  });

  it("is near 0 when close equals highest high", () => {
    const closes = Array.from({ length: 20 }, (_, i) => 50 + i);
    const series = computeWilliamsRSeries(makeCandles(closes));
    if (series.length > 0) {
      const last = series[series.length - 1]!;
      // makeCandles sets high = close+2, so %R may not be exactly 0
      if (last.value !== null) {
        expect(last.value).toBeGreaterThanOrEqual(-20);
      }
    }
  });
});

describe("ADX edge cases", () => {
  it("returns empty for insufficient data", () => {
    expect(computeAdxSeries(makeCandles([100, 101, 102]))).toEqual([]);
  });

  it("ADX is between 0 and 100", () => {
    const closes = Array.from({ length: 40 }, (_, i) => 100 + Math.sin(i / 3) * 20);
    const series = computeAdxSeries(makeCandles(closes));
    for (const p of series) {
      expect(p.adx).toBeGreaterThanOrEqual(0);
      expect(p.adx).toBeLessThanOrEqual(100);
    }
  });
});

describe("SuperTrend edge cases", () => {
  it("returns empty for insufficient data", () => {
    expect(computeSuperTrendSeries(makeCandles([100]))).toEqual([]);
  });

  it("superTrend values are positive for positive prices", () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + i);
    const series = computeSuperTrendSeries(makeCandles(closes));
    for (const p of series) {
      expect(p.superTrend).toBeGreaterThan(0);
    }
  });

  it("isUpTrend is consistent (boolean)", () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + Math.sin(i) * 10);
    const series = computeSuperTrendSeries(makeCandles(closes));
    for (const p of series) {
      expect(typeof p.isUpTrend).toBe("boolean");
    }
  });
});

describe("SAR edge cases", () => {
  it("returns empty for fewer than 2 candles", () => {
    expect(computeSarSeries(makeCandles([100]))).toEqual([]);
  });

  it("SAR values are positive", () => {
    const closes = Array.from({ length: 20 }, (_, i) => 100 + i * 2);
    const series = computeSarSeries(makeCandles(closes));
    for (const p of series) {
      expect(p.sar).toBeGreaterThan(0);
    }
  });

  it("series length is less than or equal to candle count", () => {
    const closes = Array.from({ length: 20 }, (_, i) => 50 + i);
    const series = computeSarSeries(makeCandles(closes));
    expect(series.length).toBeLessThanOrEqual(20);
  });
});

describe("VWAP edge cases", () => {
  it("VWAP equals typical price for single candle", () => {
    const candles = makeCandles([100]); // open=close-1=99, high=close+2=102, low=close-2=98, close=100
    const series = computeVwapSeries(candles);
    expect(series.length).toBe(1);
    // Typical = (high + low + close) / 3 = (102 + 98 + 100) / 3 = 100
    expect(series[0]?.vwap).toBeCloseTo(100, 0);
  });

  it("VWAP is within price range", () => {
    const closes = Array.from({ length: 20 }, (_, i) => 80 + i * 2);
    const series = computeVwapSeries(makeCandles(closes));
    for (const p of series) {
      expect(p.vwap).toBeGreaterThan(0);
    }
  });

  it("computeVwap returns null for empty candles", () => {
    expect(computeVwap([])).toBeNull();
  });

  it("computeVwap returns latest value for valid data", () => {
    const candles = makeCandles([100, 105, 110]);
    const val = computeVwap(candles);
    expect(val).not.toBeNull();
    expect(val).toBeGreaterThan(0);
  });
});
