import { describe, it, expect } from "vitest";
import { computeMtfConfluence } from "../../../src/domain/mtf-confluence";
import type { DailyCandle } from "../../../src/types/domain";

/** Generate daily candles with realistic dates spanning multiple months. */
function makeDatedCandles(startPrice: number, dailyChange: number, days: number): DailyCandle[] {
  const result: DailyCandle[] = [];
  const start = new Date("2023-01-02"); // Start on a Monday
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    // Skip weekends
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;
    const price = startPrice + dailyChange * i;
    result.push({
      date: d.toISOString().slice(0, 10),
      open: price,
      high: price + 1,
      low: price - 1,
      close: price,
      volume: 1000,
    });
  }
  return result;
}

/** Generate oscillating prices with realistic dates. */
function makeChoppyCandles(days: number): DailyCandle[] {
  const result: DailyCandle[] = [];
  const start = new Date("2023-01-02");
  let count = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;
    const price = 100 + Math.sin(count * 0.1) * 5;
    result.push({
      date: d.toISOString().slice(0, 10),
      open: price,
      high: price + 1,
      low: price - 1,
      close: price,
      volume: 1000,
    });
    count++;
  }
  return result;
}

describe("computeMtfConfluence", () => {
  it("returns null for insufficient data", () => {
    const candles = makeDatedCandles(100, 1, 30);
    expect(computeMtfConfluence(candles)).toBeNull();
  });

  it("returns null for invalid parameters", () => {
    const candles = makeDatedCandles(100, 0.5, 550);
    expect(computeMtfConfluence(candles, { shortMa: 1 })).toBeNull();
    expect(computeMtfConfluence(candles, { shortMa: 50, longMa: 20 })).toBeNull();
    expect(computeMtfConfluence(candles, { rsiPeriod: 1 })).toBeNull();
  });

  it("returns bullish result for strong uptrend", () => {
    const candles = makeDatedCandles(100, 1, 550);
    const result = computeMtfConfluence(candles)!;
    expect(result).not.toBeNull();
    expect(result.direction).toBe("bullish");
    expect(result.confluenceScore).toBeGreaterThan(0);
  });

  it("returns bearish result for strong downtrend", () => {
    const candles = makeDatedCandles(500, -1, 550);
    const result = computeMtfConfluence(candles)!;
    expect(result).not.toBeNull();
    expect(result.direction).toBe("bearish");
    expect(result.confluenceScore).toBeLessThan(0);
  });

  it("returns three timeframe signals", () => {
    const candles = makeDatedCandles(100, 0.5, 550);
    const result = computeMtfConfluence(candles)!;
    expect(result.signals.length).toBe(3);
    const timeframes = result.signals.map((s) => s.timeframe);
    expect(timeframes).toContain("daily");
    expect(timeframes).toContain("weekly");
    expect(timeframes).toContain("monthly");
  });

  it("each signal has required fields", () => {
    const candles = makeDatedCandles(100, 0.5, 550);
    const result = computeMtfConfluence(candles)!;
    for (const s of result.signals) {
      expect(s).toHaveProperty("timeframe");
      expect(s).toHaveProperty("trend");
      expect(s).toHaveProperty("strength");
      expect(s).toHaveProperty("maAlignment");
      expect(s.strength).toBeGreaterThanOrEqual(0);
      expect(s.strength).toBeLessThanOrEqual(100);
    }
  });

  it("confluenceScore is between -100 and 100", () => {
    const candles = makeDatedCandles(100, 0.3, 550);
    const result = computeMtfConfluence(candles)!;
    expect(result.confluenceScore).toBeGreaterThanOrEqual(-100);
    expect(result.confluenceScore).toBeLessThanOrEqual(100);
  });

  it("aligned is true when all timeframes agree", () => {
    const candles = makeDatedCandles(50, 1.5, 550);
    const result = computeMtfConfluence(candles)!;
    if (result.signals.every((s) => s.trend === "bullish")) {
      expect(result.aligned).toBe(true);
    }
  });

  it("respects custom options", () => {
    const candles = makeDatedCandles(100, 0.5, 550);
    const result = computeMtfConfluence(candles, {
      shortMa: 5,
      longMa: 20,
      rsiPeriod: 10,
    })!;
    expect(result).not.toBeNull();
    expect(result.signals.length).toBe(3);
  });

  it("neutral direction for choppy market", () => {
    const candles = makeChoppyCandles(550);
    const result = computeMtfConfluence(candles)!;
    expect(result).not.toBeNull();
    expect(Math.abs(result.confluenceScore)).toBeLessThan(80);
  });
});
