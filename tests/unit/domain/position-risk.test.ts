import { describe, it, expect } from "vitest";
import { computePositionRisk, computePortfolioHeat } from "../../../src/domain/position-risk";
import type { PositionInput } from "../../../src/domain/position-risk";

describe("computePositionRisk", () => {
  const basePosition: PositionInput = {
    entryPrice: 100,
    currentPrice: 110,
    stopPrice: 90,
    shares: 50,
  };

  it("calculates stop distance correctly", () => {
    const result = computePositionRisk(basePosition);
    expect(result).not.toBeNull();
    expect(result!.stopDistance).toBe(10);
    expect(result!.stopPercent).toBeCloseTo(0.1);
  });

  it("calculates dollar risk correctly", () => {
    const result = computePositionRisk(basePosition);
    expect(result!.dollarRisk).toBe(500); // 10 * 50
  });

  it("calculates unrealized P/L correctly", () => {
    const result = computePositionRisk(basePosition);
    expect(result!.unrealizedPnl).toBe(500); // (110 - 100) * 50
    expect(result!.unrealizedPnlPercent).toBeCloseTo(0.1);
  });

  it("calculates R-multiple correctly", () => {
    const result = computePositionRisk(basePosition);
    // (110 - 100) / 10 = 1.0R
    expect(result!.rMultiple).toBeCloseTo(1.0);
  });

  it("calculates risk-reward ratio with target", () => {
    const pos: PositionInput = { ...basePosition, targetPrice: 130 };
    const result = computePositionRisk(pos);
    // reward = |130 - 100| = 30, risk = 10, ratio = 3.0
    expect(result!.riskRewardRatio).toBeCloseTo(3.0);
  });

  it("returns null risk-reward without target", () => {
    const result = computePositionRisk(basePosition);
    expect(result!.riskRewardRatio).toBeNull();
  });

  it("returns null for invalid entry price", () => {
    expect(computePositionRisk({ ...basePosition, entryPrice: 0 })).toBeNull();
    expect(computePositionRisk({ ...basePosition, entryPrice: -10 })).toBeNull();
  });

  it("returns null for zero shares", () => {
    expect(computePositionRisk({ ...basePosition, shares: 0 })).toBeNull();
  });

  it("handles no stop (stopPrice = 0)", () => {
    const pos: PositionInput = { ...basePosition, stopPrice: 0 };
    const result = computePositionRisk(pos);
    expect(result!.stopDistance).toBe(0);
    expect(result!.dollarRisk).toBe(0);
    expect(result!.rMultiple).toBe(0);
  });

  it("handles losing position correctly", () => {
    const pos: PositionInput = { ...basePosition, currentPrice: 95 };
    const result = computePositionRisk(pos);
    expect(result!.unrealizedPnl).toBe(-250); // (95 - 100) * 50
    expect(result!.unrealizedPnlPercent).toBeCloseTo(-0.05);
    expect(result!.rMultiple).toBeCloseTo(-0.5);
  });
});

describe("computePortfolioHeat", () => {
  it("calculates portfolio heat correctly", () => {
    const positions = new Map<string, PositionInput>([
      ["AAPL", { entryPrice: 150, currentPrice: 160, stopPrice: 140, shares: 100 }],
      ["MSFT", { entryPrice: 300, currentPrice: 310, stopPrice: 280, shares: 50 }],
    ]);
    const result = computePortfolioHeat(positions, 100_000);
    expect(result).not.toBeNull();
    // AAPL risk: 10 * 100 = 1000, MSFT risk: 20 * 50 = 1000
    expect(result!.totalDollarRisk).toBe(2000);
    expect(result!.heatPercent).toBeCloseTo(0.02);
    expect(result!.positionCount).toBe(2);
  });

  it("returns null for zero equity", () => {
    const positions = new Map<string, PositionInput>([
      ["AAPL", { entryPrice: 150, currentPrice: 160, stopPrice: 140, shares: 100 }],
    ]);
    expect(computePortfolioHeat(positions, 0)).toBeNull();
  });

  it("returns null for empty positions", () => {
    expect(computePortfolioHeat(new Map(), 100_000)).toBeNull();
  });

  it("sorts positions by risk descending", () => {
    const positions = new Map<string, PositionInput>([
      ["LOW", { entryPrice: 10, currentPrice: 11, stopPrice: 9, shares: 10 }], // risk: 10
      ["HIGH", { entryPrice: 100, currentPrice: 110, stopPrice: 80, shares: 50 }], // risk: 1000
    ]);
    const result = computePortfolioHeat(positions, 50_000);
    expect(result!.positionRisks[0]!.symbol).toBe("HIGH");
  });

  it("skips invalid positions", () => {
    const positions = new Map<string, PositionInput>([
      ["VALID", { entryPrice: 100, currentPrice: 110, stopPrice: 90, shares: 50 }],
      ["INVALID", { entryPrice: 0, currentPrice: 110, stopPrice: 90, shares: 50 }],
    ]);
    const result = computePortfolioHeat(positions, 100_000);
    expect(result!.positionCount).toBe(1);
  });
});
