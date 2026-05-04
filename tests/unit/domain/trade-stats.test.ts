import { describe, it, expect } from "vitest";
import {
  tradePnl,
  computeStats,
  streaks,
  avgReturnPercent,
  type Trade,
} from "../../../src/domain/trade-stats";

describe("trade-stats", () => {
  const winTrade: Trade = { entryPrice: 100, exitPrice: 110, quantity: 10, side: "long" };
  const lossTrade: Trade = { entryPrice: 100, exitPrice: 90, quantity: 10, side: "long" };
  const shortWin: Trade = { entryPrice: 100, exitPrice: 90, quantity: 10, side: "short" };
  const shortLoss: Trade = { entryPrice: 100, exitPrice: 110, quantity: 10, side: "short" };

  it("tradePnl long win", () => {
    expect(tradePnl(winTrade)).toBe(100); // (110-100)*10
  });

  it("tradePnl long loss", () => {
    expect(tradePnl(lossTrade)).toBe(-100);
  });

  it("tradePnl short win", () => {
    expect(tradePnl(shortWin)).toBe(100); // (100-90)*10
  });

  it("tradePnl short loss", () => {
    expect(tradePnl(shortLoss)).toBe(-100);
  });

  it("computeStats returns zeros for empty", () => {
    const stats = computeStats([]);
    expect(stats.totalTrades).toBe(0);
    expect(stats.winRate).toBe(0);
  });

  it("computeStats calculates win rate", () => {
    const trades = [winTrade, winTrade, lossTrade];
    const stats = computeStats(trades);
    expect(stats.totalTrades).toBe(3);
    expect(stats.winners).toBe(2);
    expect(stats.losers).toBe(1);
    expect(stats.winRate).toBeCloseTo(2 / 3);
  });

  it("computeStats profitFactor", () => {
    const trades = [winTrade, lossTrade];
    const stats = computeStats(trades);
    expect(stats.profitFactor).toBe(1); // equal wins/losses
  });

  it("computeStats netPnl", () => {
    const trades = [winTrade, winTrade, lossTrade];
    const stats = computeStats(trades);
    expect(stats.netPnl).toBe(100); // 100+100-100
  });

  it("computeStats largestWin/Loss", () => {
    const bigWin: Trade = { entryPrice: 100, exitPrice: 150, quantity: 10, side: "long" };
    const stats = computeStats([bigWin, lossTrade]);
    expect(stats.largestWin).toBe(500);
    expect(stats.largestLoss).toBe(100);
  });

  it("streaks tracks consecutive wins/losses", () => {
    const trades = [winTrade, winTrade, winTrade, lossTrade, lossTrade];
    const s = streaks(trades);
    expect(s.maxWinStreak).toBe(3);
    expect(s.maxLossStreak).toBe(2);
  });

  it("avgReturnPercent computes average", () => {
    // winTrade: pnl=100, cost=1000, return=10%
    // lossTrade: pnl=-100, cost=1000, return=-10%
    const avg = avgReturnPercent([winTrade, lossTrade]);
    expect(avg).toBe(0);
  });

  it("avgReturnPercent returns 0 for empty", () => {
    expect(avgReturnPercent([])).toBe(0);
  });
});
