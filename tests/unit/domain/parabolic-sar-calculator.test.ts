import { describe, it, expect } from "vitest";
import { computeSarSeries, computeSar } from "../../../src/domain/parabolic-sar-calculator";
import { makeCandles } from "../../helpers/candle-factory";

describe("computeSarSeries", () => {
  it("returns empty for fewer than 2 candles", () => {
    expect(computeSarSeries(makeCandles([100]))).toEqual([]);
  });

  it("returns series aligned with candles", () => {
    const closes = Array.from({ length: 20 }, (_, i) => 100 + i);
    const series = computeSarSeries(makeCandles(closes));
    expect(series.length).toBe(20);
  });

  it("isUpTrend changes on reversal", () => {
    // Up trend then sharp drop
    const closes = [100, 102, 104, 106, 108, 110, 90, 85, 80, 75];
    const series = computeSarSeries(makeCandles(closes));
    const lastUp = series.findIndex((p) => !p.isUpTrend);
    expect(lastUp).toBeGreaterThan(0);
  });

  it("SAR values are positive", () => {
    const closes = Array.from({ length: 20 }, (_, i) => 100 + i);
    const series = computeSarSeries(makeCandles(closes));
    for (const p of series) expect(p.sar).toBeGreaterThan(0);
  });
});

describe("computeSar", () => {
  it("returns null for insufficient data", () => {
    expect(computeSar(makeCandles([100]))).toBeNull();
  });

  it("returns the latest SAR", () => {
    const closes = Array.from({ length: 20 }, (_, i) => 100 + i);
    const result = computeSar(makeCandles(closes));
    expect(result).not.toBeNull();
    expect(result!.sar).toBeGreaterThan(0);
  });
});
