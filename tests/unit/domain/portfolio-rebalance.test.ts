import { describe, it, expect } from "vitest";
import {
  calculateRebalance,
  actionableTrades,
  totalBuyAmount,
  totalSellAmount,
  sharesToTrade,
  validateTargets,
} from "../../../src/domain/portfolio-rebalance";

describe("portfolio-rebalance", () => {
  const holdings = [
    { ticker: "AAPL", value: 6000 },
    { ticker: "MSFT", value: 3000 },
    { ticker: "GOOG", value: 1000 },
  ];

  const targets = [
    { ticker: "AAPL", weight: 0.4 },
    { ticker: "MSFT", weight: 0.35 },
    { ticker: "GOOG", weight: 0.25 },
  ];

  it("calculateRebalance produces correct plan", () => {
    const plan = calculateRebalance(holdings, targets);
    expect(plan.totalValue).toBe(10000);
    expect(plan.trades).toHaveLength(3);
  });

  it("identifies sell for overweight position", () => {
    const plan = calculateRebalance(holdings, targets);
    const aapl = plan.trades.find((t) => t.ticker === "AAPL")!;
    // AAPL is 60% but target 40% → sell
    expect(aapl.action).toBe("sell");
    expect(aapl.drift).toBeLessThan(0);
  });

  it("identifies buy for underweight position", () => {
    const plan = calculateRebalance(holdings, targets);
    const goog = plan.trades.find((t) => t.ticker === "GOOG")!;
    // GOOG is 10% but target 25% → buy
    expect(goog.action).toBe("buy");
    expect(goog.tradeAmount).toBeGreaterThan(0);
  });

  it("marks hold when within drift threshold", () => {
    const plan = calculateRebalance(holdings, [
      { ticker: "AAPL", weight: 0.59 },
      { ticker: "MSFT", weight: 0.3 },
      { ticker: "GOOG", weight: 0.11 },
    ]);
    const aapl = plan.trades.find((t) => t.ticker === "AAPL")!;
    expect(aapl.action).toBe("hold");
  });

  it("needsRebalance reflects maxDrift vs threshold", () => {
    const plan = calculateRebalance(holdings, targets);
    expect(plan.needsRebalance).toBe(true);
    expect(plan.maxDrift).toBeGreaterThan(0.02);
  });

  it("actionableTrades excludes holds", () => {
    const plan = calculateRebalance(holdings, targets);
    const trades = actionableTrades(plan);
    expect(trades.every((t) => t.action !== "hold")).toBe(true);
  });

  it("totalBuyAmount sums buys", () => {
    const plan = calculateRebalance(holdings, targets);
    const buyAmt = totalBuyAmount(plan);
    expect(buyAmt).toBeGreaterThan(0);
  });

  it("totalSellAmount sums sells", () => {
    const plan = calculateRebalance(holdings, targets);
    const sellAmt = totalSellAmount(plan);
    expect(sellAmt).toBeGreaterThan(0);
  });

  it("sharesToTrade calculates floor of shares", () => {
    expect(sharesToTrade(1500, 190)).toBe(7); // 1500/190 = 7.89 → 7
    expect(sharesToTrade(-1000, 100)).toBe(10);
  });

  it("sharesToTrade returns 0 for zero price", () => {
    expect(sharesToTrade(1000, 0)).toBe(0);
  });

  it("validateTargets passes for valid allocations", () => {
    expect(validateTargets(targets)).toBe(true);
    expect(validateTargets([{ ticker: "A", weight: 0.5 }])).toBe(false);
  });

  it("handles empty portfolio", () => {
    const plan = calculateRebalance([], targets);
    expect(plan.totalValue).toBe(0);
    expect(plan.needsRebalance).toBe(false);
  });
});
