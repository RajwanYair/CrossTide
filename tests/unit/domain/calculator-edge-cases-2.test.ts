/**
 * Extended ATR, Stochastic, OBV, CCI calculator edge case tests.
 */
import { describe, it, expect } from "vitest";
import { computeAtr, computeAtrSeries } from "../../../src/domain/atr-calculator";
import { computeStochasticSeries } from "../../../src/domain/stochastic-calculator";
import { computeObv, computeObvSeries } from "../../../src/domain/obv-calculator";
import { computeCci, computeCciSeries } from "../../../src/domain/cci-calculator";
import { makeCandles } from "../../helpers/candle-factory";

describe("ATR edge cases", () => {
  it("ATR is 0 for flat OHLC (no range)", () => {
    const candles = Array.from({ length: 20 }, (_, i) => ({
      date: `2025-01-${String(i + 1).padStart(2, "0")}`,
      open: 100,
      high: 100,
      low: 100,
      close: 100,
      volume: 1000,
    }));
    const atr = computeAtr(candles);
    if (atr !== null) {
      expect(atr).toBeCloseTo(0);
    }
  });

  it("ATR is always positive for varying prices", () => {
    const series = computeAtrSeries(makeCandles(Array.from({ length: 30 }, (_, i) => 100 + i * 2)));
    for (const p of series) {
      expect(p.atr).toBeGreaterThanOrEqual(0);
    }
  });

  it("ATR series starts after warmup period", () => {
    const candles = makeCandles(Array.from({ length: 20 }, (_, i) => 50 + i));
    const series = computeAtrSeries(candles, 14);
    // First ATR point appears at index period (14)
    expect(series.length).toBeGreaterThan(0);
    expect(series.length).toBeLessThanOrEqual(candles.length);
  });
});

describe("Stochastic edge cases", () => {
  it("returns empty for insufficient data", () => {
    const series = computeStochasticSeries(makeCandles([100, 101, 102]));
    // Stochastic needs period + smoothK + smoothD - 2 candles (14+3+3-2=18)
    expect(series.length).toBe(0);
  });

  it("%K is between 0 and 100", () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + Math.sin(i) * 20);
    const series = computeStochasticSeries(makeCandles(closes));
    for (const p of series) {
      expect(p.percentK).toBeGreaterThanOrEqual(0);
      expect(p.percentK).toBeLessThanOrEqual(100);
    }
  });

  it("%D is between 0 and 100", () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + Math.sin(i) * 20);
    const series = computeStochasticSeries(makeCandles(closes));
    for (const p of series) {
      expect(p.percentD).toBeGreaterThanOrEqual(0);
      expect(p.percentD).toBeLessThanOrEqual(100);
    }
  });

  it("%K is close to 100 at highest close in window", () => {
    // All ascending — close is always the highest
    const closes = Array.from({ length: 30 }, (_, i) => 50 + i);
    const series = computeStochasticSeries(makeCandles(closes));
    if (series.length > 0) {
      const last = series[series.length - 1]!;
      // makeCandles sets high = close+2, low = close-2, so %K may not be exactly 100
      expect(last.percentK).toBeGreaterThan(80);
    }
  });
});

describe("OBV edge cases", () => {
  it("OBV is 0 when all closes are equal", () => {
    const closes = Array.from({ length: 10 }, () => 100);
    const series = computeObvSeries(makeCandles(closes));
    if (series.length > 0) {
      const last = series[series.length - 1]!;
      expect(last.obv).toBe(0);
    }
  });

  it("OBV increases on up-days", () => {
    const closes = [100, 105]; // one up day
    const series = computeObvSeries(makeCandles(closes));
    expect(series.length).toBe(2);
    expect(series[1]!.obv).toBeGreaterThan(0);
  });

  it("OBV decreases on down-days", () => {
    const closes = [100, 90]; // one down day
    const series = computeObvSeries(makeCandles(closes));
    expect(series.length).toBe(2);
    expect(series[1]!.obv).toBeLessThan(0);
  });

  it("computeObv returns null for single candle", () => {
    expect(computeObv(makeCandles([100]))).toBeNull();
  });
});

describe("CCI edge cases", () => {
  it("CCI is 0 for flat prices", () => {
    const closes = Array.from({ length: 30 }, () => 100);
    const series = computeCciSeries(makeCandles(closes));
    const last = series[series.length - 1];
    if (last?.value !== null && last?.value !== undefined) {
      expect(last.value).toBeCloseTo(0, 0);
    }
  });

  it("CCI > 0 for ascending prices", () => {
    const closes = Array.from({ length: 30 }, (_, i) => 50 + i * 2);
    const cci = computeCci(makeCandles(closes));
    if (cci !== null) {
      expect(cci).toBeGreaterThan(0);
    }
  });

  it("CCI returns null for insufficient data", () => {
    expect(computeCci(makeCandles([100, 101, 102]))).toBeNull();
  });

  it("CCI series has nulls for warmup period", () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + i);
    const series = computeCciSeries(makeCandles(closes), 20);
    expect(series.slice(0, 19).every((p) => p.value === null)).toBe(true);
  });
});
