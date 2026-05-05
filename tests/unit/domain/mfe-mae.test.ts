import { describe, it, expect } from "vitest";
import { computeExcursions } from "../../../src/domain/mfe-mae";
import type { DailyCandle } from "../../../src/types/domain";

function makeOhlcCandles(data: { h: number; l: number; c: number }[]): DailyCandle[] {
  return data.map((d, i) => ({
    date: `2024-01-${String(i + 1).padStart(2, "0")}`,
    open: d.c,
    high: d.h,
    low: d.l,
    close: d.c,
    volume: 1000,
  }));
}

describe("computeExcursions", () => {
  it("returns empty summary for no trades", () => {
    const candles = makeOhlcCandles([{ h: 101, l: 99, c: 100 }]);
    const result = computeExcursions(candles, []);
    expect(result.trades).toEqual([]);
    expect(result.avgMfe).toBe(0);
    expect(result.avgMae).toBe(0);
  });

  it("computes mfe and mae for a long trade", () => {
    const candles = makeOhlcCandles([
      { h: 101, l: 99, c: 100 }, // entry at index 0, price 100
      { h: 105, l: 98, c: 103 }, // MFE: (105-100)/100 = 5%, MAE: (100-98)/100 = 2%
      { h: 107, l: 97, c: 102 }, // MFE: (107-100)/100 = 7%, MAE: (100-97)/100 = 3%
      { h: 104, l: 100, c: 103 }, // exit at index 3
    ]);

    const result = computeExcursions(candles, [
      { entryIndex: 0, exitIndex: 3, direction: "LONG", entryPrice: 100 },
    ]);

    expect(result.trades.length).toBe(1);
    const trade = result.trades[0]!;
    expect(trade.mfePercent).toBe(7); // max high = 107
    expect(trade.maePercent).toBe(3); // max low = 97
    expect(trade.profitPercent).toBe(3); // exit close 103, entry 100
    expect(trade.captureRatio).toBeCloseTo(3 / 7, 3);
  });

  it("computes mfe and mae for a short trade", () => {
    const candles = makeOhlcCandles([
      { h: 101, l: 99, c: 100 }, // entry at index 0, short at 100
      { h: 102, l: 95, c: 96 }, // MAE: (102-100)/100 = 2%, MFE: (100-95)/100 = 5%
      { h: 99, l: 93, c: 94 }, // MAE: 0 (from entry not exceed), MFE: (100-93)/100 = 7%
      { h: 98, l: 92, c: 95 }, // exit close 95 → profit = (100-95)/100 = 5%
    ]);

    const result = computeExcursions(candles, [
      { entryIndex: 0, exitIndex: 3, direction: "SHORT", entryPrice: 100 },
    ]);

    expect(result.trades.length).toBe(1);
    const trade = result.trades[0]!;
    expect(trade.mfePercent).toBe(8); // (100-92)/100 = 8%
    expect(trade.maePercent).toBe(2); // (102-100)/100 = 2%
    expect(trade.profitPercent).toBe(5); // (100-95)/100 = 5%
  });

  it("computes aggregate statistics", () => {
    const candles = makeOhlcCandles([
      { h: 101, l: 99, c: 100 },
      { h: 110, l: 95, c: 108 }, // trade 1: MFE=10%, MAE=5%
      { h: 109, l: 100, c: 105 },
      { h: 112, l: 98, c: 106 }, // trade 2: MFE=12%, MAE=2%
      { h: 108, l: 97, c: 104 },
    ]);

    const result = computeExcursions(candles, [
      { entryIndex: 0, exitIndex: 1, direction: "LONG", entryPrice: 100 },
      { entryIndex: 2, exitIndex: 3, direction: "LONG", entryPrice: 105 },
    ]);

    expect(result.trades.length).toBe(2);
    expect(result.avgMfe).toBeGreaterThan(0);
    expect(result.avgMae).toBeGreaterThan(0);
    expect(result.suggestedStopLoss).toBeGreaterThan(0);
    expect(result.suggestedTakeProfit).toBeGreaterThan(0);
  });

  it("skips invalid trades (entryIndex >= exitIndex)", () => {
    const candles = makeOhlcCandles([
      { h: 101, l: 99, c: 100 },
      { h: 102, l: 98, c: 101 },
    ]);

    const result = computeExcursions(candles, [
      { entryIndex: 1, exitIndex: 0, direction: "LONG", entryPrice: 100 },
    ]);

    expect(result.trades).toEqual([]);
  });

  it("skips trades with exitIndex beyond candles", () => {
    const candles = makeOhlcCandles([{ h: 101, l: 99, c: 100 }]);

    const result = computeExcursions(candles, [
      { entryIndex: 0, exitIndex: 5, direction: "LONG", entryPrice: 100 },
    ]);

    expect(result.trades).toEqual([]);
  });

  it("capture ratio is 1.0 when trade exits at exact MFE", () => {
    const candles = makeOhlcCandles([
      { h: 100, l: 100, c: 100 }, // entry
      { h: 110, l: 100, c: 110 }, // high = exit close = 110
    ]);

    const result = computeExcursions(candles, [
      { entryIndex: 0, exitIndex: 1, direction: "LONG", entryPrice: 100 },
    ]);

    expect(result.trades[0]!.captureRatio).toBe(1);
  });
});
