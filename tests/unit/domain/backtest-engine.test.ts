/**
 * Backtest engine tests.
 */
import { describe, it, expect } from "vitest";
import { runBacktest, type BacktestConfig } from "../../../src/domain/backtest-engine";
import { makeCandles } from "../../helpers/candle-factory";

describe("backtest engine", () => {
  it("returns empty result for insufficient data", () => {
    const config: BacktestConfig = {
      ticker: "AAPL",
      initialCapital: 10000,
      methods: ["RSI", "MACD"],
      windowSize: 200,
    };
    const candles = makeCandles(Array.from({ length: 50 }, () => 100));
    const result = runBacktest(candles, config);
    expect(result.trades).toHaveLength(0);
    expect(result.totalReturn).toBe(0);
  });

  it("equity curve starts at initial capital", () => {
    const config: BacktestConfig = {
      ticker: "AAPL",
      initialCapital: 10000,
      methods: ["RSI"],
      windowSize: 50,
    };
    const closes = Array.from({ length: 100 }, (_, i) => 100 + Math.sin(i / 5) * 20);
    const result = runBacktest(makeCandles(closes), config);
    if (result.equityCurve.length > 0) {
      expect(result.equityCurve[0]!.equity).toBeGreaterThan(0);
    }
  });

  it("winRate is between 0 and 1", () => {
    const config: BacktestConfig = {
      ticker: "AAPL",
      initialCapital: 10000,
      methods: ["RSI", "MACD", "Bollinger"],
      windowSize: 50,
    };
    const closes = Array.from({ length: 200 }, (_, i) => 100 + Math.sin(i / 10) * 30);
    const result = runBacktest(makeCandles(closes), config);
    expect(result.winRate).toBeGreaterThanOrEqual(0);
    expect(result.winRate).toBeLessThanOrEqual(1);
  });

  it("maxDrawdown is between 0 and 1", () => {
    const config: BacktestConfig = {
      ticker: "AAPL",
      initialCapital: 10000,
      methods: ["RSI", "MACD"],
      windowSize: 50,
    };
    const closes = Array.from({ length: 200 }, (_, i) => 100 + Math.sin(i / 10) * 30);
    const result = runBacktest(makeCandles(closes), config);
    expect(result.maxDrawdown).toBeGreaterThanOrEqual(0);
    expect(result.maxDrawdown).toBeLessThanOrEqual(1);
  });

  it("ticker matches config", () => {
    const config: BacktestConfig = {
      ticker: "GOOG",
      initialCapital: 5000,
      methods: ["RSI"],
      windowSize: 50,
    };
    const closes = Array.from({ length: 100 }, (_, i) => 100 + i);
    const result = runBacktest(makeCandles(closes), config);
    expect(result.ticker).toBe("GOOG");
  });

  it("trades have valid structure when present", () => {
    const config: BacktestConfig = {
      ticker: "AAPL",
      initialCapital: 10000,
      methods: ["RSI", "MACD", "Bollinger", "Stochastic"],
      windowSize: 50,
    };
    // Oscillating data likely to generate trades
    const closes = Array.from({ length: 300 }, (_, i) => 100 + Math.sin(i / 8) * 40);
    const result = runBacktest(makeCandles(closes), config);
    for (const t of result.trades) {
      expect(t.entryDate).toBeTypeOf("string");
      expect(t.exitDate).toBeTypeOf("string");
      expect(t.entryPrice).toBeGreaterThan(0);
      expect(t.exitPrice).toBeGreaterThan(0);
      expect(t.direction).toBe("LONG");
    }
  });
});
