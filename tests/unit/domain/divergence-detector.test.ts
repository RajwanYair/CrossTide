import { describe, it, expect } from "vitest";
import { detectDivergences } from "../../../src/domain/divergence-detector";
import type { DailyCandle } from "../../../src/types/domain";

function makeCandle(date: string, close: number, high: number, low: number): DailyCandle {
  return { date, open: close, high, low, close, volume: 1000 };
}

describe("detectDivergences", () => {
  it("returns empty for insufficient data", () => {
    const candles: DailyCandle[] = [makeCandle("2024-01-01", 100, 101, 99)];
    const osc = [50];
    expect(detectDivergences(candles, osc)).toEqual([]);
  });

  it("returns empty when lengths mismatch", () => {
    const candles = Array.from({ length: 20 }, (_, i) =>
      makeCandle(`2024-01-${String(i + 1).padStart(2, "0")}`, 100, 101, 99),
    );
    const osc = [50]; // mismatched length
    expect(detectDivergences(candles, osc)).toEqual([]);
  });

  it("detects bullish divergence (price lower-low, oscillator higher-low)", () => {
    // Build a series where price makes lower lows but oscillator makes higher lows
    // We need pivot lows with strength=2
    const prices = [100, 98, 95, 98, 100, 102, 104, 106, 104, 102, 100, 97, 93, 97, 100, 103, 105];
    const lows = prices.map((p) => p - 1);
    const highs = prices.map((p) => p + 1);
    const candles = prices.map((p, i) =>
      makeCandle(`2024-01-${String(i + 1).padStart(2, "0")}`, p, highs[i]!, lows[i]!),
    );

    // Oscillator: first low at index 2 = 20, second low at index 12 = 25 (higher)
    const osc = [50, 30, 20, 30, 50, 60, 70, 80, 60, 50, 40, 30, 25, 30, 50, 60, 70];

    const result = detectDivergences(candles, osc, {
      pivotStrength: 2,
      minDistance: 5,
      maxDistance: 30,
    });

    expect(result.length).toBeGreaterThanOrEqual(1);
    const bullish = result.filter((d) => d.type === "bullish");
    expect(bullish.length).toBeGreaterThanOrEqual(1);
    const div = bullish[0]!;
    expect(div.priceEnd).toBeLessThan(div.priceStart); // price lower low
    expect(div.oscillatorEnd).toBeGreaterThan(div.oscillatorStart); // osc higher low
  });

  it("detects bearish divergence (price higher-high, oscillator lower-high)", () => {
    // Price makes higher highs, oscillator makes lower highs
    const prices = [100, 102, 105, 102, 100, 98, 96, 94, 96, 98, 100, 103, 107, 103, 100, 97, 95];
    const lows = prices.map((p) => p - 1);
    const highs = prices.map((p) => p + 1);
    const candles = prices.map((p, i) =>
      makeCandle(`2024-01-${String(i + 1).padStart(2, "0")}`, p, highs[i]!, lows[i]!),
    );

    // Oscillator: first high at index 2 = 80, second high at index 12 = 70 (lower)
    const osc = [50, 60, 80, 60, 50, 40, 30, 20, 30, 40, 50, 60, 70, 60, 50, 40, 30];

    const result = detectDivergences(candles, osc, {
      pivotStrength: 2,
      minDistance: 5,
      maxDistance: 30,
    });

    expect(result.length).toBeGreaterThanOrEqual(1);
    const bearish = result.filter((d) => d.type === "bearish");
    expect(bearish.length).toBeGreaterThanOrEqual(1);
    const div = bearish[0]!;
    expect(div.priceEnd).toBeGreaterThan(div.priceStart); // price higher high
    expect(div.oscillatorEnd).toBeLessThan(div.oscillatorStart); // osc lower high
  });

  it("returns empty when no divergence exists", () => {
    // Trending up with confirming oscillator (both making higher highs)
    const prices = [90, 92, 95, 92, 90, 91, 93, 97, 93, 91, 92, 94, 100, 94, 92, 93, 95];
    const highs = prices.map((p) => p + 1);
    const lows = prices.map((p) => p - 1);
    const candles = prices.map((p, i) =>
      makeCandle(`2024-01-${String(i + 1).padStart(2, "0")}`, p, highs[i]!, lows[i]!),
    );

    // Oscillator confirming the price direction (both higher highs)
    const osc = [30, 40, 60, 40, 30, 35, 45, 75, 45, 35, 40, 50, 85, 50, 40, 45, 55];

    const result = detectDivergences(candles, osc, {
      pivotStrength: 2,
      minDistance: 5,
      maxDistance: 30,
    });

    const bearish = result.filter((d) => d.type === "bearish");
    expect(bearish.length).toBe(0);
  });

  it("respects minDistance option", () => {
    // Create pivots that are only 3 apart — should be filtered out with minDistance=5
    const prices = [100, 98, 95, 98, 100, 97, 93, 97, 100, 102, 104];
    const lows = prices.map((p) => p - 1);
    const highs = prices.map((p) => p + 1);
    const candles = prices.map((p, i) =>
      makeCandle(`2024-01-${String(i + 1).padStart(2, "0")}`, p, highs[i]!, lows[i]!),
    );

    const osc = [50, 30, 20, 30, 50, 35, 25, 35, 50, 60, 70];

    const result = detectDivergences(candles, osc, {
      pivotStrength: 1,
      minDistance: 10,
      maxDistance: 30,
    });

    // Pivots are too close together to meet minDistance=10
    expect(result.length).toBe(0);
  });

  it("handles null values in oscillator", () => {
    const prices = Array.from({ length: 20 }, (_, i) => 100 + Math.sin(i) * 5);
    const candles = prices.map((p, i) =>
      makeCandle(`2024-01-${String(i + 1).padStart(2, "0")}`, p, p + 1, p - 1),
    );
    const osc: (number | null)[] = prices.map((_, i) => (i < 5 ? null : 50 + Math.cos(i) * 20));

    // Should not throw, may return empty
    const result = detectDivergences(candles, osc);
    expect(Array.isArray(result)).toBe(true);
  });
});
