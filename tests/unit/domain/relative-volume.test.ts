import { describe, it, expect } from "vitest";
import { computeRelativeVolume, detectVolumeSurges } from "../../../src/domain/relative-volume";
import type { DailyCandle } from "../../../src/types/domain";

function makeVolumeCandles(volumes: number[]): DailyCandle[] {
  return volumes.map((vol, i) => ({
    date: `2024-01-${String(i + 1).padStart(2, "0")}`,
    open: 100,
    high: 101,
    low: 99,
    close: 100,
    volume: vol,
  }));
}

describe("computeRelativeVolume", () => {
  it("returns null for insufficient data", () => {
    const candles = makeVolumeCandles([1000, 2000, 3000]);
    expect(computeRelativeVolume(candles, { period: 5 })).toBeNull();
  });

  it("returns correct number of points", () => {
    const candles = makeVolumeCandles(Array.from({ length: 30 }, () => 1000));
    const result = computeRelativeVolume(candles, { period: 10 });
    expect(result).not.toBeNull();
    expect(result!.length).toBe(20); // 30 - 10
  });

  it("rvol is 1.0 for constant volume", () => {
    const candles = makeVolumeCandles(Array.from({ length: 25 }, () => 5000));
    const result = computeRelativeVolume(candles, { period: 10 });
    expect(result).not.toBeNull();
    for (const point of result!) {
      expect(point.rvol).toBe(1);
    }
  });

  it("rvol > 1 when volume exceeds average", () => {
    // 10 bars at 1000, then one bar at 3000
    const volumes = [...Array.from({ length: 10 }, () => 1000), 3000];
    const candles = makeVolumeCandles(volumes);
    const result = computeRelativeVolume(candles, { period: 10 });
    expect(result).not.toBeNull();
    expect(result![0]!.rvol).toBe(3);
  });

  it("rvol < 1 when volume below average", () => {
    // 10 bars at 2000, then one bar at 500
    const volumes = [...Array.from({ length: 10 }, () => 2000), 500];
    const candles = makeVolumeCandles(volumes);
    const result = computeRelativeVolume(candles, { period: 10 });
    expect(result).not.toBeNull();
    expect(result![0]!.rvol).toBe(0.25);
  });

  it("handles zero average volume gracefully", () => {
    const volumes = [...Array.from({ length: 10 }, () => 0), 1000];
    const candles = makeVolumeCandles(volumes);
    const result = computeRelativeVolume(candles, { period: 10 });
    expect(result).not.toBeNull();
    expect(result![0]!.rvol).toBe(0); // 0 avg → rvol = 0
  });

  it("includes date, volume, and avgVolume in output", () => {
    const volumes = [...Array.from({ length: 10 }, () => 1000), 2000];
    const candles = makeVolumeCandles(volumes);
    const result = computeRelativeVolume(candles, { period: 10 });
    expect(result).not.toBeNull();
    const point = result![0]!;
    expect(point.date).toBe("2024-01-11");
    expect(point.volume).toBe(2000);
    expect(point.avgVolume).toBe(1000);
  });
});

describe("detectVolumeSurges", () => {
  it("returns empty for insufficient data", () => {
    const candles = makeVolumeCandles([1000, 2000]);
    expect(detectVolumeSurges(candles, 2.0, { period: 5 })).toEqual([]);
  });

  it("detects surges above threshold", () => {
    // 10 bars at 1000, then 5000 (5x), then 500
    const volumes = [...Array.from({ length: 10 }, () => 1000), 5000, 500];
    const candles = makeVolumeCandles(volumes);
    const surges = detectVolumeSurges(candles, 2.0, { period: 10 });
    expect(surges).toContain(10); // index 10 has 5x volume
    expect(surges).not.toContain(11); // index 11 is only 0.5x
  });

  it("returns empty when no surges", () => {
    const candles = makeVolumeCandles(Array.from({ length: 25 }, () => 1000));
    const surges = detectVolumeSurges(candles, 2.0, { period: 10 });
    expect(surges).toEqual([]);
  });

  it("uses default threshold of 2.0", () => {
    const volumes = [...Array.from({ length: 20 }, () => 1000), 1900, 2100];
    const candles = makeVolumeCandles(volumes);
    const surges = detectVolumeSurges(candles, undefined, { period: 20 });
    // 1900/1000 = 1.9 < 2.0, 2100/~1045 ≈ 2.0+
    expect(surges.length).toBeGreaterThanOrEqual(1);
  });
});
