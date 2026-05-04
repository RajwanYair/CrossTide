import { describe, it, expect } from "vitest";
import {
  analyzeRiskReward,
  positionSizeFromRisk,
  dollarRisk,
  expectedValue,
  batchAnalyze,
  filterFavorable,
  sortByRatio,
} from "../../../src/domain/risk-reward";

describe("risk-reward", () => {
  it("analyzeRiskReward for long with 3:1 ratio", () => {
    const result = analyzeRiskReward({
      entry: 100,
      stopLoss: 95,
      target: 115,
      direction: "long",
    });
    expect(result.riskPerShare).toBe(5);
    expect(result.rewardPerShare).toBe(15);
    expect(result.ratio).toBe(3);
    expect(result.favorable).toBe(true);
  });

  it("analyzeRiskReward for short trade", () => {
    const result = analyzeRiskReward({
      entry: 100,
      stopLoss: 105,
      target: 85,
      direction: "short",
    });
    expect(result.riskPerShare).toBe(5);
    expect(result.rewardPerShare).toBe(15);
    expect(result.ratio).toBe(3);
  });

  it("marks unfavorable when ratio < 2", () => {
    const result = analyzeRiskReward({
      entry: 100,
      stopLoss: 90,
      target: 105,
      direction: "long",
    });
    expect(result.ratio).toBe(0.5);
    expect(result.favorable).toBe(false);
  });

  it("handles zero risk gracefully", () => {
    const result = analyzeRiskReward({
      entry: 100,
      stopLoss: 100,
      target: 110,
      direction: "long",
    });
    expect(result.ratio).toBe(0);
  });

  it("positionSizeFromRisk calculates shares", () => {
    const shares = positionSizeFromRisk(100, 95, 500);
    expect(shares).toBe(100); // $500 / $5 risk = 100 shares
  });

  it("positionSizeFromRisk returns 0 for zero risk", () => {
    expect(positionSizeFromRisk(100, 100, 500)).toBe(0);
  });

  it("dollarRisk computes total risk", () => {
    const risk = dollarRisk(100, 95, 50);
    expect(risk).toBe(250); // $5 * 50 shares
  });

  it("expectedValue positive when profitable", () => {
    // 60% win rate, 2:1 R:R → 0.6*2 - 0.4 = 0.8
    expect(expectedValue(0.6, 2)).toBeCloseTo(0.8, 5);
  });

  it("expectedValue negative when unprofitable", () => {
    // 30% win rate, 1:1 R:R → 0.3*1 - 0.7 = -0.4
    expect(expectedValue(0.3, 1)).toBeCloseTo(-0.4, 5);
  });

  it("filterFavorable keeps only good setups", () => {
    const setups = [
      { entry: 100, stopLoss: 95, target: 115, direction: "long" as const },
      { entry: 100, stopLoss: 90, target: 105, direction: "long" as const },
    ];
    const analyses = batchAnalyze(setups);
    const good = filterFavorable(analyses);
    expect(good).toHaveLength(1);
    expect(good[0]!.ratio).toBe(3);
  });

  it("sortByRatio orders best first", () => {
    const setups = [
      { entry: 100, stopLoss: 95, target: 110, direction: "long" as const }, // 2:1
      { entry: 100, stopLoss: 95, target: 120, direction: "long" as const }, // 4:1
    ];
    const analyses = batchAnalyze(setups);
    const sorted = sortByRatio(analyses);
    expect(sorted[0]!.ratio).toBe(4);
    expect(sorted[1]!.ratio).toBe(2);
  });
});
