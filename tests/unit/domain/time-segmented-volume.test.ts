import { describe, it, expect } from "vitest";
import { computeTsv } from "../../../src/domain/time-segmented-volume";
import { makeCandles } from "../../helpers/candle-factory";

describe("computeTsv", () => {
  it("returns null for insufficient data", () => {
    const candles = makeCandles([100, 101, 102]);
    expect(computeTsv(candles)).toBeNull();
  });

  it("returns points with correct structure", () => {
    const prices = Array.from({ length: 30 }, (_, i) => 100 + i);
    const result = computeTsv(makeCandles(prices));
    expect(result).not.toBeNull();
    const point = result![0]!;
    expect(point).toHaveProperty("date");
    expect(point).toHaveProperty("tsv");
    expect(point).toHaveProperty("signal");
  });

  it("returns correct number of points", () => {
    const prices = Array.from({ length: 40 }, (_, i) => 100 + i);
    // default lookback=13, signalPeriod=7, so minBars=20
    // output length = 40 - 13 = 27 points
    const result = computeTsv(makeCandles(prices));
    expect(result).not.toBeNull();
    expect(result!.length).toBe(27);
  });

  it("positive TSV for uptrend (accumulation)", () => {
    const prices = Array.from({ length: 40 }, (_, i) => 100 + i * 3);
    const result = computeTsv(makeCandles(prices));
    expect(result).not.toBeNull();
    // All TSV values should be positive in uptrend
    for (const point of result!) {
      expect(point.tsv).toBeGreaterThan(0);
    }
  });

  it("negative TSV for downtrend (distribution)", () => {
    const prices = Array.from({ length: 40 }, (_, i) => 200 - i * 3);
    const result = computeTsv(makeCandles(prices));
    expect(result).not.toBeNull();
    for (const point of result!) {
      expect(point.tsv).toBeLessThan(0);
    }
  });

  it("near-zero TSV for flat prices", () => {
    const prices = Array.from({ length: 40 }, () => 100);
    const result = computeTsv(makeCandles(prices));
    expect(result).not.toBeNull();
    for (const point of result!) {
      expect(point.tsv).toBe(0);
    }
  });

  it("respects custom lookback and signal period", () => {
    const prices = Array.from({ length: 40 }, (_, i) => 100 + i);
    const result = computeTsv(makeCandles(prices), { lookback: 5, signalPeriod: 3 });
    expect(result).not.toBeNull();
    // lookback=5 → output starts at index 5, length = 40 - 5 = 35
    expect(result!.length).toBe(35);
  });

  it("each point has a valid date", () => {
    const prices = Array.from({ length: 30 }, (_, i) => 100 + i);
    const result = computeTsv(makeCandles(prices));
    expect(result).not.toBeNull();
    for (const point of result!) {
      expect(point.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
