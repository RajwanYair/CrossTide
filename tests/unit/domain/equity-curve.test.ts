import { describe, it, expect } from "vitest";
import {
  buildEquityCurve,
  summarizeTrades,
  tradePnl,
  type ClosedTrade,
} from "../../../src/domain/equity-curve";

const long = (entry: number, exit: number, qty = 1, entryT = 0, exitT = 1): ClosedTrade => ({
  side: "long",
  entryPrice: entry,
  exitPrice: exit,
  quantity: qty,
  entryTime: entryT,
  exitTime: exitT,
});

describe("equity-curve", () => {
  it("tradePnl long winning", () => {
    expect(tradePnl(long(100, 110, 2))).toBe(20);
  });

  it("tradePnl short winning", () => {
    expect(tradePnl({ ...long(100, 90), side: "short" })).toBe(10);
  });

  it("buildEquityCurve seeds with starting balance", () => {
    const c = buildEquityCurve([], 5000);
    expect(c).toHaveLength(1);
    expect(c[0]!.equity).toBe(5000);
  });

  it("buildEquityCurve compounds across trades", () => {
    const trades: ClosedTrade[] = [
      long(100, 110, 1, 0, 100),
      long(110, 105, 1, 100, 200),
      long(105, 130, 1, 200, 300),
    ];
    const c = buildEquityCurve(trades, 1000);
    expect(c[c.length - 1]!.equity).toBe(1000 + 10 - 5 + 25);
  });

  it("buildEquityCurve sorts by exit time", () => {
    const trades: ClosedTrade[] = [long(100, 110, 1, 0, 200), long(100, 105, 1, 0, 100)];
    const c = buildEquityCurve(trades, 1000);
    expect(c[0]!.time).toBe(100);
    expect(c[1]!.time).toBe(200);
  });

  it("summarizeTrades empty", () => {
    expect(summarizeTrades([]).trades).toBe(0);
  });

  it("summarizeTrades winRate, profitFactor", () => {
    const s = summarizeTrades([long(100, 110), long(100, 90), long(100, 105)]);
    expect(s.trades).toBe(3);
    expect(s.winRate).toBeCloseTo(2 / 3, 5);
    expect(s.profitFactor).toBeCloseTo((10 + 5) / 10, 5);
    expect(s.avgWin).toBeCloseTo(7.5, 5);
    expect(s.avgLoss).toBeCloseTo(10, 5);
  });

  it("summarizeTrades all wins → infinite profitFactor", () => {
    const s = summarizeTrades([long(100, 110), long(100, 105)]);
    expect(s.profitFactor).toBe(Infinity);
  });

  it("default quantity is 1", () => {
    const t: ClosedTrade = {
      side: "long",
      entryPrice: 100,
      exitPrice: 110,
      entryTime: 0,
      exitTime: 1,
    };
    expect(tradePnl(t)).toBe(10);
  });
});
