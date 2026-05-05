import { describe, it, expect } from "vitest";
import { compareRiskAdjusted } from "../../../src/domain/risk-adjusted-comparison";
import { makeCandles } from "../../helpers/candle-factory";

// Rising asset: 100 → ~150 over 100 days
const risingPrices = Array.from({ length: 100 }, (_, i) => 100 + i * 0.5);
// Falling asset: 100 → ~50 over 100 days
const fallingPrices = Array.from({ length: 100 }, (_, i) => 100 - i * 0.5);
// Flat asset: hovers around 100
const flatPrices = Array.from({ length: 100 }, (_, i) => 100 + Math.sin(i / 5) * 2);

describe("compareRiskAdjusted", () => {
  it("returns null for fewer than 2 assets", () => {
    const result = compareRiskAdjusted([{ symbol: "A", candles: makeCandles(risingPrices) }]);
    expect(result).toBeNull();
  });

  it("returns null when any asset has fewer than 20 candles", () => {
    const shortPrices = Array.from({ length: 10 }, (_, i) => 100 + i);
    const result = compareRiskAdjusted([
      { symbol: "A", candles: makeCandles(risingPrices) },
      { symbol: "B", candles: makeCandles(shortPrices) },
    ]);
    expect(result).toBeNull();
  });

  it("returns metrics for each asset", () => {
    const result = compareRiskAdjusted([
      { symbol: "RISE", candles: makeCandles(risingPrices) },
      { symbol: "FALL", candles: makeCandles(fallingPrices) },
    ])!;
    expect(result.assets).toHaveLength(2);
    expect(result.assets[0]!.symbol).toBe("RISE");
    expect(result.assets[1]!.symbol).toBe("FALL");
  });

  it("rising asset has positive return, falling has negative", () => {
    const result = compareRiskAdjusted([
      { symbol: "RISE", candles: makeCandles(risingPrices) },
      { symbol: "FALL", candles: makeCandles(fallingPrices) },
    ])!;
    expect(result.assets[0]!.totalReturn).toBeGreaterThan(0);
    expect(result.assets[1]!.totalReturn).toBeLessThan(0);
  });

  it("rising asset has higher Sharpe than falling", () => {
    const result = compareRiskAdjusted([
      { symbol: "RISE", candles: makeCandles(risingPrices) },
      { symbol: "FALL", candles: makeCandles(fallingPrices) },
    ])!;
    expect(result.assets[0]!.sharpe).toBeGreaterThan(result.assets[1]!.sharpe);
  });

  it("sharpeRanking has rising asset first", () => {
    const result = compareRiskAdjusted([
      { symbol: "RISE", candles: makeCandles(risingPrices) },
      { symbol: "FALL", candles: makeCandles(fallingPrices) },
    ])!;
    expect(result.sharpeRanking[0]).toBe("RISE");
    expect(result.sortinoRanking[0]).toBe("RISE");
  });

  it("falling asset has larger max drawdown", () => {
    const result = compareRiskAdjusted([
      { symbol: "RISE", candles: makeCandles(risingPrices) },
      { symbol: "FALL", candles: makeCandles(fallingPrices) },
    ])!;
    expect(result.assets[1]!.maxDrawdownPercent).toBeGreaterThan(
      result.assets[0]!.maxDrawdownPercent,
    );
  });

  it("annualized volatility is non-negative", () => {
    const result = compareRiskAdjusted([
      { symbol: "A", candles: makeCandles(risingPrices) },
      { symbol: "B", candles: makeCandles(flatPrices) },
    ])!;
    for (const asset of result.assets) {
      expect(asset.annualizedVol).toBeGreaterThanOrEqual(0);
    }
  });

  it("compares three assets correctly", () => {
    const result = compareRiskAdjusted([
      { symbol: "RISE", candles: makeCandles(risingPrices) },
      { symbol: "FLAT", candles: makeCandles(flatPrices) },
      { symbol: "FALL", candles: makeCandles(fallingPrices) },
    ])!;
    expect(result.assets).toHaveLength(3);
    expect(result.sharpeRanking).toHaveLength(3);
    expect(result.sharpeRanking[0]).toBe("RISE");
  });

  it("accepts custom risk-free rate", () => {
    const r1 = compareRiskAdjusted(
      [
        { symbol: "A", candles: makeCandles(risingPrices) },
        { symbol: "B", candles: makeCandles(flatPrices) },
      ],
      0.0,
    )!;
    const r2 = compareRiskAdjusted(
      [
        { symbol: "A", candles: makeCandles(risingPrices) },
        { symbol: "B", candles: makeCandles(flatPrices) },
      ],
      0.1,
    )!;
    // Higher risk-free rate should lower Sharpe
    expect(r1.assets[0]!.sharpe).toBeGreaterThan(r2.assets[0]!.sharpe);
  });
});
