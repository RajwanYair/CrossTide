import { describe, it, expect } from "vitest";
import { runSmaCrossoverLocal } from "../../../src/core/backtest-worker-fallback";

/** Build simple synthetic candles with a known price sequence. */
function makeCandles(prices: number[]): { close: number }[] {
  return prices.map((close) => ({ close }));
}

/** Create a price series with a single golden cross at index `crossAt`. */
function pricesWithCross(len: number, crossAt: number): number[] {
  const prices = new Array<number>(len);
  for (let i = 0; i < len; i++) {
    // Before crossAt: flat downtrend (fast < slow); after: uptrend (fast > slow)
    prices[i] = i < crossAt ? 100 - i * 0.01 : 100 + (i - crossAt) * 0.5;
  }
  return prices;
}

describe("runSmaCrossoverLocal — basic properties", () => {
  const candles = makeCandles(
    // 100 bars: gradual rise then fall — should produce at least one cross
    Array.from({ length: 100 }, (_, i) => {
      if (i < 40) return 100 + i; // rising: fast > slow (buy)
      if (i < 60) return 140 - (i - 40) * 2; // falling: fast < slow (sell)
      return 100 + (i - 60) * 0.5; // slow rise again
    }),
  );

  it("returns expected result keys", () => {
    const result = runSmaCrossoverLocal(candles, 5, 20, 10_000);
    expect(result).toHaveProperty("trades");
    expect(result).toHaveProperty("equityPoints");
    expect(result).toHaveProperty("stats");
    expect(result).toHaveProperty("maxDrawdown");
    expect(result).toHaveProperty("annReturn");
    expect(result).toHaveProperty("finalEquity");
    expect(result).toHaveProperty("totalReturnPct");
  });

  it("finalEquity equals initial capital when no trades occur", () => {
    // Flat prices — no SMA crossover
    const flat = makeCandles(Array.from({ length: 50 }, () => 100));
    const result = runSmaCrossoverLocal(flat, 5, 20, 10_000);
    expect(result.trades).toHaveLength(0);
    expect(result.finalEquity).toBe(10_000);
    expect(result.totalReturnPct).toBe(0);
  });

  it("trades array has correct structure", () => {
    const result = runSmaCrossoverLocal(candles, 5, 20, 10_000);
    for (const trade of result.trades) {
      expect(trade).toHaveProperty("entryTime");
      expect(trade).toHaveProperty("exitTime");
      expect(trade).toHaveProperty("entryPrice");
      expect(trade).toHaveProperty("exitPrice");
      expect(trade.side).toBe("long");
      expect(trade.exitTime).toBeGreaterThan(trade.entryTime);
    }
  });

  it("equityPoints has at least as many points as trades", () => {
    const result = runSmaCrossoverLocal(candles, 5, 20, 10_000);
    expect(result.equityPoints.length).toBeGreaterThanOrEqual(result.trades.length);
  });

  it("maxDrawdown is a non-negative number", () => {
    const result = runSmaCrossoverLocal(candles, 5, 20, 10_000);
    expect(result.maxDrawdown).toBeGreaterThanOrEqual(0);
  });

  it("totalReturnPct equals ((finalEquity - initialCapital) / initialCapital) * 100", () => {
    const result = runSmaCrossoverLocal(candles, 5, 20, 10_000);
    expect(result.totalReturnPct).toBeCloseTo(((result.finalEquity - 10_000) / 10_000) * 100, 5);
  });
});

describe("runSmaCrossoverLocal — cross detection", () => {
  it("closes an open position at end of data", () => {
    // V-shape: fall then rise creates a golden cross mid-series
    // The fast SMA will cross above slow SMA as prices recover
    const prices: number[] = [];
    for (let i = 0; i < 60; i++) {
      if (i < 25)
        prices.push(120 - i * 2); // falling: slow > fast initially
      else prices.push(70 + (i - 25) * 3); // rising: fast crosses above slow
    }
    const result = runSmaCrossoverLocal(makeCandles(prices), 5, 20, 10_000);
    // A golden cross must have occurred; last trade force-closed at end
    expect(result.trades.length).toBeGreaterThanOrEqual(1);
    if (result.trades.length > 0) {
      const last = result.trades[result.trades.length - 1]!;
      expect(last.exitTime).toBe(59);
    }
  });

  it("detects multiple crosses in oscillating prices", () => {
    // Build a series with clear up/down oscillations to force multiple crosses
    const prices: number[] = [];
    for (let i = 0; i < 200; i++) {
      prices.push(100 + Math.sin(i * 0.3) * 20);
    }
    const result = runSmaCrossoverLocal(makeCandles(prices), 5, 20, 10_000);
    expect(result.trades.length).toBeGreaterThan(1);
  });

  it("produces a buy at fast SMA crossover above slow SMA", () => {
    const prices = pricesWithCross(80, 40);
    const result = runSmaCrossoverLocal(makeCandles(prices), 5, 20, 10_000);
    expect(result.trades.length).toBeGreaterThanOrEqual(1);
  });
});

describe("runSmaCrossoverLocal — edge cases", () => {
  it("handles minimal data length equal to slow period", () => {
    const prices = makeCandles(Array.from({ length: 20 }, (_, i) => 100 + i));
    // Only slowPeriod bars → loop starts at i=20 which is out of bounds → no trades
    const result = runSmaCrossoverLocal(prices, 5, 20, 10_000);
    expect(result.finalEquity).toBe(10_000);
  });

  it("handles very short series", () => {
    const prices = makeCandles([100, 101, 102, 103, 104]);
    const result = runSmaCrossoverLocal(prices, 2, 4, 5_000);
    expect(result).toHaveProperty("trades");
  });

  it("stats object is populated", () => {
    const candles2 = makeCandles(
      Array.from({ length: 100 }, (_, i) => {
        if (i < 40) return 100 + i;
        return 140 - (i - 40) * 2;
      }),
    );
    const result = runSmaCrossoverLocal(candles2, 5, 20, 10_000);
    expect(typeof result.stats).toBe("object");
  });

  it("different initial capitals scale finalEquity proportionally (no trades case)", () => {
    const flat = makeCandles(Array.from({ length: 50 }, () => 100));
    const r1 = runSmaCrossoverLocal(flat, 5, 20, 5_000);
    const r2 = runSmaCrossoverLocal(flat, 5, 20, 20_000);
    expect(r1.finalEquity).toBe(5_000);
    expect(r2.finalEquity).toBe(20_000);
  });
});
