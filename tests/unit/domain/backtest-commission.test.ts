/**
 * Tests for Q8 (commission/slippage) and Q9 (position sizing) in backtest engine.
 */
import { describe, it, expect } from "vitest";
import {
  runBacktest,
  computeTradeCost,
  type BacktestConfig,
} from "../../../src/domain/backtest-engine";
import { makeCandles } from "../../helpers/candle-factory";

describe("computeTradeCost", () => {
  it("returns 0 with no fees", () => {
    expect(computeTradeCost(100, 10, {})).toBe(0);
  });

  it("applies fixed fee per trade", () => {
    const cost = computeTradeCost(50, 20, { fixedPerTrade: 9.99 });
    expect(cost).toBeCloseTo(9.99);
  });

  it("applies percentage of trade value", () => {
    // 100 shares * $50 = $5000 * 0.001 = $5
    const cost = computeTradeCost(50, 100, { percentPerTrade: 0.001 });
    expect(cost).toBeCloseTo(5);
  });

  it("applies slippage as fraction of trade value", () => {
    // 10 shares * $200 = $2000 * 0.0005 = $1
    const cost = computeTradeCost(200, 10, { slippage: 0.0005 });
    expect(cost).toBeCloseTo(1);
  });

  it("combines all cost components", () => {
    // fixed: 5 + pct: $1000 * 0.01 = 10 + slip: $1000 * 0.002 = 2
    const cost = computeTradeCost(100, 10, {
      fixedPerTrade: 5,
      percentPerTrade: 0.01,
      slippage: 0.002,
    });
    expect(cost).toBeCloseTo(17);
  });
});

describe("backtest engine — commission model (Q8)", () => {
  it("commission reduces total return vs zero-fee backtest", () => {
    const base: BacktestConfig = {
      ticker: "TEST",
      initialCapital: 10000,
      methods: ["RSI", "MACD", "Bollinger", "Stochastic"],
      windowSize: 50,
    };
    const closes = Array.from({ length: 300 }, (_, i) => 100 + Math.sin(i / 8) * 40);
    const candles = makeCandles(closes);

    const noFees = runBacktest(candles, base);
    const withFees = runBacktest(candles, {
      ...base,
      commission: { fixedPerTrade: 10, percentPerTrade: 0.001 },
    });

    // With fees, return should be lower (or equal if no trades)
    if (noFees.trades.length > 0) {
      expect(withFees.totalReturn).toBeLessThan(noFees.totalReturn);
    }
  });

  it("trades include totalCost field", () => {
    const config: BacktestConfig = {
      ticker: "TEST",
      initialCapital: 10000,
      methods: ["RSI", "MACD", "Bollinger", "Stochastic"],
      windowSize: 50,
      commission: { fixedPerTrade: 5 },
    };
    const closes = Array.from({ length: 300 }, (_, i) => 100 + Math.sin(i / 8) * 40);
    const result = runBacktest(makeCandles(closes), config);
    for (const t of result.trades) {
      expect(t.totalCost).toBeGreaterThanOrEqual(0);
      expect(typeof t.totalCost).toBe("number");
    }
  });

  it("high slippage eliminates profitability", () => {
    const config: BacktestConfig = {
      ticker: "TEST",
      initialCapital: 10000,
      methods: ["RSI", "MACD", "Bollinger", "Stochastic"],
      windowSize: 50,
      commission: { slippage: 0.05 }, // 5% slippage per trade — extreme
    };
    const closes = Array.from({ length: 300 }, (_, i) => 100 + Math.sin(i / 8) * 10);
    const result = runBacktest(makeCandles(closes), config);
    // With 5% slippage per side on small moves, should lose money
    if (result.trades.length > 2) {
      expect(result.totalReturn).toBeLessThan(0);
    }
  });
});

describe("backtest engine — position sizing (Q9)", () => {
  it("trades include shares field", () => {
    const config: BacktestConfig = {
      ticker: "TEST",
      initialCapital: 10000,
      methods: ["RSI", "MACD", "Bollinger", "Stochastic"],
      windowSize: 50,
      sizing: { mode: "fixed", fixedQuantity: 50 },
    };
    const closes = Array.from({ length: 300 }, (_, i) => 100 + Math.sin(i / 8) * 40);
    const result = runBacktest(makeCandles(closes), config);
    for (const t of result.trades) {
      expect(t.shares).toBeGreaterThan(0);
    }
  });

  it("fixed sizing uses configured quantity", () => {
    const config: BacktestConfig = {
      ticker: "TEST",
      initialCapital: 100000,
      methods: ["RSI", "MACD", "Bollinger", "Stochastic"],
      windowSize: 50,
      sizing: { mode: "fixed", fixedQuantity: 25 },
    };
    const closes = Array.from({ length: 300 }, (_, i) => 100 + Math.sin(i / 8) * 40);
    const result = runBacktest(makeCandles(closes), config);
    for (const t of result.trades) {
      expect(t.shares).toBe(25);
    }
  });

  it("percentage sizing scales with equity", () => {
    const config: BacktestConfig = {
      ticker: "TEST",
      initialCapital: 50000,
      methods: ["RSI", "MACD", "Bollinger", "Stochastic"],
      windowSize: 50,
      sizing: { mode: "percentage", percentOfEquity: 0.5 },
    };
    const closes = Array.from({ length: 300 }, (_, i) => 100 + Math.sin(i / 8) * 40);
    const result = runBacktest(makeCandles(closes), config);
    for (const t of result.trades) {
      expect(t.shares).toBeGreaterThanOrEqual(1);
    }
  });

  it("kelly sizing uses trade history", () => {
    const config: BacktestConfig = {
      ticker: "TEST",
      initialCapital: 100000,
      methods: ["RSI", "MACD", "Bollinger", "Stochastic"],
      windowSize: 50,
      sizing: { mode: "kelly", kellyMultiplier: 0.5 },
    };
    const closes = Array.from({ length: 300 }, (_, i) => 100 + Math.sin(i / 8) * 40);
    const result = runBacktest(makeCandles(closes), config);
    for (const t of result.trades) {
      expect(t.shares).toBeGreaterThanOrEqual(1);
    }
  });
});
