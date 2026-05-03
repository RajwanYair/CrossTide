/**
 * Unit tests for chart-comparison domain module.
 */
import { describe, it, expect } from "vitest";
import { normalizeForComparison, computeComparisonStats } from "../../src/domain/chart-comparison";
import type { DailyCandle } from "../../src/types/domain";

function candle(date: string, close: number): DailyCandle {
  return { date, open: close, high: close, low: close, close, volume: 100 };
}

describe("normalizeForComparison", () => {
  it("returns empty array for empty input", () => {
    expect(normalizeForComparison(new Map())).toEqual([]);
  });

  it("normalizes two tickers to % change from first common date", () => {
    const aapl = [candle("2024-01-01", 100), candle("2024-01-02", 110), candle("2024-01-03", 105)];
    const msft = [candle("2024-01-01", 200), candle("2024-01-02", 220), candle("2024-01-03", 210)];

    const map = new Map<string, readonly DailyCandle[]>([
      ["AAPL", aapl],
      ["MSFT", msft],
    ]);

    const result = normalizeForComparison(map);
    expect(result).toHaveLength(2);
    expect(result[0]!.ticker).toBe("AAPL");
    expect(result[1]!.ticker).toBe("MSFT");

    // First point should be 0% for both
    expect(result[0]!.points[0]!.pctChange).toBe(0);
    expect(result[1]!.points[0]!.pctChange).toBe(0);

    // AAPL: +10%
    expect(result[0]!.points[1]!.pctChange).toBeCloseTo(0.1);
    // MSFT: +10%
    expect(result[1]!.points[1]!.pctChange).toBeCloseTo(0.1);

    // AAPL: +5%
    expect(result[0]!.points[2]!.pctChange).toBeCloseTo(0.05);
    // MSFT: +5%
    expect(result[1]!.points[2]!.pctChange).toBeCloseTo(0.05);
  });

  it("only uses common dates across all tickers", () => {
    const a = [candle("2024-01-01", 100), candle("2024-01-02", 110), candle("2024-01-03", 120)];
    const b = [candle("2024-01-02", 50), candle("2024-01-03", 55)]; // missing Jan 01

    const map = new Map<string, readonly DailyCandle[]>([
      ["A", a],
      ["B", b],
    ]);

    const result = normalizeForComparison(map);
    // Only Jan 02 and Jan 03 are common
    expect(result[0]!.points).toHaveLength(2);
    expect(result[0]!.points[0]!.date).toBe("2024-01-02");
    // A normalized from 110: 0%, then (120-110)/110 ≈ 9.09%
    expect(result[0]!.points[0]!.pctChange).toBe(0);
    expect(result[0]!.points[1]!.pctChange).toBeCloseTo(0.0909, 3);
  });

  it("handles zero base close gracefully", () => {
    const a = [candle("2024-01-01", 0), candle("2024-01-02", 10)];
    const b = [candle("2024-01-01", 100), candle("2024-01-02", 120)];

    const map = new Map<string, readonly DailyCandle[]>([
      ["A", a],
      ["B", b],
    ]);

    const result = normalizeForComparison(map);
    // A has base 0, so all pctChange = 0 (safe division)
    expect(result[0]!.points[0]!.pctChange).toBe(0);
    expect(result[0]!.points[1]!.pctChange).toBe(0);
    // B: 0%, 20%
    expect(result[1]!.points[1]!.pctChange).toBeCloseTo(0.2);
  });

  it("returns empty points when no common dates", () => {
    const a = [candle("2024-01-01", 100)];
    const b = [candle("2024-01-02", 50)];

    const map = new Map<string, readonly DailyCandle[]>([
      ["A", a],
      ["B", b],
    ]);

    const result = normalizeForComparison(map);
    expect(result[0]!.points).toEqual([]);
    expect(result[1]!.points).toEqual([]);
  });
});

describe("computeComparisonStats", () => {
  it("returns zeros for empty series", () => {
    const stats = computeComparisonStats({ ticker: "X", points: [] });
    expect(stats.totalReturn).toBe(0);
    expect(stats.maxDrawdown).toBe(0);
    expect(stats.bestDay).toBe(0);
    expect(stats.worstDay).toBe(0);
  });

  it("computes total return from last point", () => {
    const stats = computeComparisonStats({
      ticker: "AAPL",
      points: [
        { date: "2024-01-01", pctChange: 0 },
        { date: "2024-01-02", pctChange: 0.05 },
        { date: "2024-01-03", pctChange: 0.12 },
      ],
    });
    expect(stats.totalReturn).toBeCloseTo(0.12);
  });

  it("computes max drawdown", () => {
    const stats = computeComparisonStats({
      ticker: "X",
      points: [
        { date: "d1", pctChange: 0 },
        { date: "d2", pctChange: 0.1 }, // peak
        { date: "d3", pctChange: -0.05 }, // drawdown from peak = 0.15
        { date: "d4", pctChange: 0.02 },
      ],
    });
    expect(stats.maxDrawdown).toBeCloseTo(0.15);
  });

  it("computes best and worst day", () => {
    const stats = computeComparisonStats({
      ticker: "Y",
      points: [
        { date: "d1", pctChange: 0 },
        { date: "d2", pctChange: 0.08 }, // +8% day
        { date: "d3", pctChange: -0.02 }, // -10% day
        { date: "d4", pctChange: 0.01 }, // +3% day
      ],
    });
    expect(stats.bestDay).toBeCloseTo(0.08);
    expect(stats.worstDay).toBeCloseTo(-0.1);
  });
});
