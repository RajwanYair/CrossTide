import { describe, it, expect } from "vitest";
import { computeVolumeProfile } from "../../../src/domain/volume-profile";
import type { Candle } from "../../../src/domain/heikin-ashi";

const candle = (low: number, high: number, vol: number): Candle => ({
  time: 0,
  open: low,
  high,
  low,
  close: (low + high) / 2,
  volume: vol,
});

describe("volume-profile", () => {
  it("empty candles returns empty profile", () => {
    const p = computeVolumeProfile([]);
    expect(p.bins).toEqual([]);
    expect(p.totalVolume).toBe(0);
  });

  it("totals match input volume", () => {
    const candles = [candle(10, 20, 100), candle(15, 25, 50)];
    const p = computeVolumeProfile(candles, { bins: 10 });
    expect(p.totalVolume).toBeCloseTo(150, 5);
  });

  it("POC is the highest-volume bin", () => {
    const candles = [
      candle(10, 11, 1000), // dense at 10-11
      candle(20, 21, 10),
    ];
    const p = computeVolumeProfile(candles, { bins: 12 });
    expect(p.poc).toBeGreaterThanOrEqual(10);
    expect(p.poc).toBeLessThanOrEqual(11);
  });

  it("value area brackets POC", () => {
    const candles = [
      candle(10, 11, 500),
      candle(11, 12, 800),
      candle(12, 13, 500),
      candle(13, 14, 200),
    ];
    const p = computeVolumeProfile(candles, { bins: 4, valueAreaPct: 0.7 });
    expect(p.valueAreaLow).toBeLessThanOrEqual(p.poc);
    expect(p.valueAreaHigh).toBeGreaterThanOrEqual(p.poc);
  });

  it("requested bin count is honored", () => {
    const candles = [candle(0, 100, 1)];
    const p = computeVolumeProfile(candles, { bins: 7 });
    expect(p.bins.length).toBe(7);
  });

  it("ignores zero/missing volume candles", () => {
    const candles = [
      { ...candle(10, 20, 0), volume: undefined as number | undefined },
      candle(10, 20, 100),
    ];
    const p = computeVolumeProfile(candles, { bins: 5 });
    expect(p.totalVolume).toBeCloseTo(100, 5);
  });

  it("value area covers >= valueAreaPct of volume", () => {
    const candles = Array.from({ length: 20 }, (_, i) =>
      candle(10 + i, 11 + i, 50 + i * 10),
    );
    const p = computeVolumeProfile(candles, { bins: 20, valueAreaPct: 0.7 });
    const va = p.bins
      .filter((b) => b.priceHigh > p.valueAreaLow && b.priceLow < p.valueAreaHigh)
      .reduce((s, b) => s + b.volume, 0);
    expect(va / p.totalVolume).toBeGreaterThanOrEqual(0.7);
  });
});
