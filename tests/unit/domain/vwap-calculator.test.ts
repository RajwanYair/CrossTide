import { describe, it, expect } from "vitest";
import { computeVwapSeries, computeVwap } from "../../../src/domain/vwap-calculator";
import { makeCandles } from "../../helpers/candle-factory";

describe("computeVwapSeries", () => {
  it("returns empty for no candles", () => {
    expect(computeVwapSeries([])).toEqual([]);
  });

  it("series length matches candle count", () => {
    const candles = makeCandles([100, 105, 110]);
    const series = computeVwapSeries(candles);
    expect(series.length).toBe(3);
  });

  it("VWAP equals typical price for single candle", () => {
    const candles = makeCandles([100]);
    const series = computeVwapSeries(candles);
    const tp = (candles[0]!.high + candles[0]!.low + candles[0]!.close) / 3;
    expect(series[0]!.vwap).toBeCloseTo(tp);
  });

  it("VWAP is within price range", () => {
    const closes = Array.from({ length: 20 }, (_, i) => 100 + i);
    const candles = makeCandles(closes);
    const series = computeVwapSeries(candles);
    for (const p of series) {
      expect(p.vwap).toBeGreaterThan(90);
      expect(p.vwap).toBeLessThan(130);
    }
  });
});

describe("computeVwap", () => {
  it("returns null for empty candles", () => {
    expect(computeVwap([])).toBeNull();
  });

  it("returns the latest VWAP", () => {
    const result = computeVwap(makeCandles([100, 105, 110]));
    expect(result).toBeTypeOf("number");
  });
});
