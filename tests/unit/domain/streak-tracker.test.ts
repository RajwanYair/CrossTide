import { describe, it, expect } from "vitest";
import {
  currentStreak,
  longestGainStreak,
  longestLossStreak,
  analyzeStreak,
  rankByStreak,
  getGainStreaks,
  getLossStreaks,
} from "../../../src/domain/streak-tracker";

describe("streak-tracker", () => {
  it("currentStreak detects gain streak", () => {
    // 3 consecutive up days at end
    const prices = [100, 95, 96, 97, 98];
    expect(currentStreak(prices)).toBe(3);
  });

  it("currentStreak detects loss streak", () => {
    const prices = [100, 105, 104, 103, 102];
    expect(currentStreak(prices)).toBe(-3);
  });

  it("currentStreak returns 0 for flat end", () => {
    const prices = [100, 105, 105];
    expect(currentStreak(prices)).toBe(0);
  });

  it("currentStreak returns 0 for insufficient data", () => {
    expect(currentStreak([100])).toBe(0);
    expect(currentStreak([])).toBe(0);
  });

  it("longestGainStreak finds maximum run", () => {
    const prices = [100, 101, 102, 100, 101, 102, 103, 104, 100];
    expect(longestGainStreak(prices)).toBe(4); // 100→101→102→103→104
  });

  it("longestLossStreak finds maximum run", () => {
    const prices = [100, 99, 98, 100, 99, 98, 97, 96, 95];
    expect(longestLossStreak(prices)).toBe(5); // 100→99→98→97→96→95
  });

  it("analyzeStreak returns full result", () => {
    const prices = [100, 101, 102, 103]; // 3-day gain streak
    const result = analyzeStreak("aapl", prices);
    expect(result.ticker).toBe("AAPL");
    expect(result.currentStreak).toBe(3);
    expect(result.direction).toBe("gain");
    expect(result.longestGainStreak).toBe(3);
    expect(result.longestLossStreak).toBe(0);
  });

  it("rankByStreak sorts by absolute streak length", () => {
    const tickers = [
      { ticker: "A", prices: [100, 101, 102] }, // +2
      { ticker: "B", prices: [100, 99, 98, 97, 96] }, // -4
      { ticker: "C", prices: [100, 101] }, // +1
    ];
    const ranked = rankByStreak(tickers);
    expect(ranked[0]!.ticker).toBe("B");
    expect(ranked[1]!.ticker).toBe("A");
    expect(ranked[2]!.ticker).toBe("C");
  });

  it("getGainStreaks filters by minimum days", () => {
    const results = [
      {
        ticker: "A",
        currentStreak: 5,
        direction: "gain" as const,
        longestGainStreak: 5,
        longestLossStreak: 0,
      },
      {
        ticker: "B",
        currentStreak: 2,
        direction: "gain" as const,
        longestGainStreak: 2,
        longestLossStreak: 0,
      },
      {
        ticker: "C",
        currentStreak: -3,
        direction: "loss" as const,
        longestGainStreak: 0,
        longestLossStreak: 3,
      },
    ];
    const streaks = getGainStreaks(results, 3);
    expect(streaks).toHaveLength(1);
    expect(streaks[0]!.ticker).toBe("A");
  });

  it("getLossStreaks filters by minimum days", () => {
    const results = [
      {
        ticker: "A",
        currentStreak: -2,
        direction: "loss" as const,
        longestGainStreak: 0,
        longestLossStreak: 2,
      },
      {
        ticker: "B",
        currentStreak: -5,
        direction: "loss" as const,
        longestGainStreak: 0,
        longestLossStreak: 5,
      },
    ];
    const streaks = getLossStreaks(results, 3);
    expect(streaks).toHaveLength(1);
    expect(streaks[0]!.ticker).toBe("B");
  });
});
