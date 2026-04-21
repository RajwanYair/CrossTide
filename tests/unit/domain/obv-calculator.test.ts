import { describe, it, expect } from "vitest";
import { computeObvSeries, computeObv } from "../../../src/domain/obv-calculator";
import { makeCandles } from "../../helpers/candle-factory";

describe("computeObvSeries", () => {
  it("returns empty for fewer than 2 candles", () => {
    expect(computeObvSeries(makeCandles([100]))).toEqual([]);
  });

  it("first entry has OBV 0", () => {
    const series = computeObvSeries(makeCandles([100, 105, 103]));
    expect(series[0]?.obv).toBe(0);
  });

  it("adds volume on up days", () => {
    const series = computeObvSeries(makeCandles([100, 105, 110]));
    expect(series[1]!.obv).toBe(1000);
    expect(series[2]!.obv).toBe(2000);
  });

  it("subtracts volume on down days", () => {
    const series = computeObvSeries(makeCandles([110, 105, 100]));
    expect(series[1]!.obv).toBe(-1000);
    expect(series[2]!.obv).toBe(-2000);
  });

  it("unchanged on equal close", () => {
    const series = computeObvSeries(makeCandles([100, 100, 100]));
    expect(series[1]!.obv).toBe(0);
    expect(series[2]!.obv).toBe(0);
  });
});

describe("computeObv", () => {
  it("returns null for insufficient data", () => {
    expect(computeObv(makeCandles([100]))).toBeNull();
  });

  it("returns the latest OBV", () => {
    expect(computeObv(makeCandles([100, 110, 105]))).toBe(0);
  });
});
