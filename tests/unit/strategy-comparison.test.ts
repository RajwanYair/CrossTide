/**
 * Unit tests for strategy comparison.
 */
import { describe, it, expect } from "vitest";
import {
  compareStrategies,
  renderComparisonTable,
  type StrategyComparisonInput,
} from "../../src/domain/strategy-comparison";
import type { DailyCandle } from "../../src/types/domain";

/** Generate synthetic candles with a trend. */
function makeCandles(count: number, startPrice = 100): DailyCandle[] {
  const candles: DailyCandle[] = [];
  let price = startPrice;
  for (let i = 0; i < count; i++) {
    const change = Math.sin(i * 0.3) * 3 + i * 0.05; // oscillation + slight uptrend
    price = startPrice + change;
    const date = `2024-01-${String(i + 1).padStart(2, "0")}`;
    candles.push({
      date,
      open: price - 0.5,
      high: price + 1,
      low: price - 1,
      close: price,
      volume: 1000 + i * 10,
    });
  }
  return candles;
}

describe("compareStrategies", () => {
  const candles = makeCandles(100);

  it("returns results for both strategies", () => {
    const input: StrategyComparisonInput = {
      candles,
      strategyA: {
        ticker: "TEST",
        initialCapital: 10000,
        methods: ["RSI", "MACD"],
        windowSize: 14,
      },
      strategyB: {
        ticker: "TEST",
        initialCapital: 10000,
        methods: ["Bollinger", "Stochastic"],
        windowSize: 14,
      },
    };

    const result = compareStrategies(input);
    expect(result.resultA).toBeDefined();
    expect(result.resultB).toBeDefined();
    expect(result.resultA.ticker).toBe("TEST");
    expect(result.resultB.ticker).toBe("TEST");
  });

  it("computes delta correctly", () => {
    const input: StrategyComparisonInput = {
      candles,
      strategyA: { ticker: "TEST", initialCapital: 10000, methods: ["RSI"], windowSize: 14 },
      strategyB: { ticker: "TEST", initialCapital: 10000, methods: ["MACD"], windowSize: 14 },
    };

    const result = compareStrategies(input);
    const { delta } = result;

    // returnDiff = A.totalReturnPercent - B.totalReturnPercent
    expect(delta.returnDiff).toBeCloseTo(
      result.resultA.totalReturnPercent - result.resultB.totalReturnPercent,
    );

    // winRateDiff = A.winRate - B.winRate
    expect(delta.winRateDiff).toBeCloseTo(result.resultA.winRate - result.resultB.winRate);

    // tradeCountDiff = A.trades.length - B.trades.length
    expect(delta.tradeCountDiff).toBe(result.resultA.trades.length - result.resultB.trades.length);
  });

  it("determines winner based on risk-adjusted return", () => {
    const input: StrategyComparisonInput = {
      candles,
      strategyA: {
        ticker: "TEST",
        initialCapital: 10000,
        methods: ["RSI", "MACD", "Bollinger"],
        windowSize: 14,
      },
      strategyB: {
        ticker: "TEST",
        initialCapital: 10000,
        methods: ["RSI", "MACD", "Bollinger"],
        windowSize: 14,
      },
    };

    // Same strategies → should be TIE
    const result = compareStrategies(input);
    expect(result.delta.winner).toBe("TIE");
  });

  it("handles insufficient data gracefully", () => {
    const shortCandles = makeCandles(10);
    const input: StrategyComparisonInput = {
      candles: shortCandles,
      strategyA: { ticker: "TEST", initialCapital: 10000, methods: ["RSI"], windowSize: 14 },
      strategyB: { ticker: "TEST", initialCapital: 10000, methods: ["MACD"], windowSize: 14 },
    };

    const result = compareStrategies(input);
    // Should still return valid results (even if empty trades)
    expect(result.resultA.trades).toEqual([]);
    expect(result.resultB.trades).toEqual([]);
    expect(result.delta.winner).toBe("TIE");
  });
});

describe("renderComparisonTable", () => {
  const candles = makeCandles(100);

  it("renders an HTML table with metrics", () => {
    const input: StrategyComparisonInput = {
      candles,
      strategyA: {
        ticker: "TEST",
        initialCapital: 10000,
        methods: ["RSI", "MACD"],
        windowSize: 14,
      },
      strategyB: { ticker: "TEST", initialCapital: 10000, methods: ["Bollinger"], windowSize: 14 },
    };
    const result = compareStrategies(input);
    const html = renderComparisonTable(result);

    expect(html).toContain("Strategy A");
    expect(html).toContain("Strategy B");
    expect(html).toContain("Total Return");
    expect(html).toContain("Win Rate");
    expect(html).toContain("Max Drawdown");
    expect(html).toContain("Trades");
    expect(html).toContain("Winner");
  });
});
