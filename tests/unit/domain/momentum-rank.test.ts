import { describe, it, expect } from "vitest";
import {
  rateOfChange,
  rankByMomentum,
  compositeMomentum,
  rankByCompositeMomentum,
  getMomentumLeaders,
  getMomentumLaggards,
} from "../../../src/domain/momentum-rank";

describe("momentum-rank", () => {
  it("rateOfChange computes percentage return", () => {
    const prices = [100, 105, 110, 115, 120];
    expect(rateOfChange(prices, 4)).toBeCloseTo(20, 5);
  });

  it("rateOfChange returns 0 for insufficient data", () => {
    expect(rateOfChange([100, 110], 5)).toBe(0);
    expect(rateOfChange([100], 1)).toBe(0);
  });

  it("rateOfChange handles zero past price", () => {
    expect(rateOfChange([0, 50, 100], 2)).toBe(0);
  });

  it("rankByMomentum sorts by strongest first", () => {
    const tickers = [
      { ticker: "AAPL", prices: [100, 105] }, // +5%
      { ticker: "MSFT", prices: [100, 120] }, // +20%
      { ticker: "GOOG", prices: [100, 90] }, // -10%
    ];
    const ranked = rankByMomentum(tickers, 1);
    expect(ranked[0]!.ticker).toBe("MSFT");
    expect(ranked[0]!.rank).toBe(1);
    expect(ranked[1]!.ticker).toBe("AAPL");
    expect(ranked[1]!.rank).toBe(2);
    expect(ranked[2]!.ticker).toBe("GOOG");
    expect(ranked[2]!.rank).toBe(3);
  });

  it("rankByMomentum normalizes to uppercase", () => {
    const ranked = rankByMomentum([{ ticker: "aapl", prices: [100, 110] }], 1);
    expect(ranked[0]!.ticker).toBe("AAPL");
  });

  it("compositeMomentum averages multiple timeframes", () => {
    // 60+ data points needed for long period
    const prices: number[] = [];
    for (let i = 0; i <= 60; i++) prices.push(100 + i);
    // short(5): (160-155)/155 * 100 ≈ 3.23%
    // medium(20): (160-140)/140 * 100 ≈ 14.29%
    // long(60): (160-100)/100 * 100 = 60%
    const result = compositeMomentum(prices, 5, 20, 60);
    expect(result).toBeGreaterThan(0);
  });

  it("rankByCompositeMomentum ranks correctly", () => {
    const makeRising = (base: number, step: number) => {
      const arr: number[] = [];
      for (let i = 0; i <= 60; i++) arr.push(base + i * step);
      return arr;
    };

    const tickers = [
      { ticker: "SLOW", prices: makeRising(100, 0.5) },
      { ticker: "FAST", prices: makeRising(100, 2) },
      { ticker: "MED", prices: makeRising(100, 1) },
    ];
    const ranked = rankByCompositeMomentum(tickers);
    expect(ranked[0]!.ticker).toBe("FAST");
    expect(ranked[2]!.ticker).toBe("SLOW");
  });

  it("getMomentumLeaders returns top N", () => {
    const rankings = [
      { ticker: "A", roc: 20, rank: 1 },
      { ticker: "B", roc: 15, rank: 2 },
      { ticker: "C", roc: 10, rank: 3 },
    ];
    const leaders = getMomentumLeaders(rankings, 2);
    expect(leaders).toHaveLength(2);
    expect(leaders[0]!.ticker).toBe("A");
  });

  it("getMomentumLaggards returns bottom N", () => {
    const rankings = [
      { ticker: "A", roc: 20, rank: 1 },
      { ticker: "B", roc: 15, rank: 2 },
      { ticker: "C", roc: -5, rank: 3 },
    ];
    const laggards = getMomentumLaggards(rankings, 1);
    expect(laggards).toHaveLength(1);
    expect(laggards[0]!.ticker).toBe("C");
  });

  it("handles empty input gracefully", () => {
    expect(rankByMomentum([], 10)).toEqual([]);
    expect(rankByCompositeMomentum([])).toEqual([]);
  });
});
