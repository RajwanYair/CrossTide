import { describe, it, expect } from "vitest";
import {
  totalReturn,
  cagr,
  maxDrawdown,
  sharpe,
  periodReturns,
  winRate,
  profitFactor,
  computeMetrics,
  type EquityPoint,
  type Trade,
} from "../../../src/domain/backtest-metrics";

const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;

const eq = (curve: readonly [number, number][]): EquityPoint[] =>
  curve.map(([timestamp, value]) => ({ timestamp, value }));

describe("backtest-metrics", () => {
  it("totalReturn", () => {
    expect(
      totalReturn(
        eq([
          [0, 100],
          [1, 110],
        ]),
      ),
    ).toBeCloseTo(0.1, 5);
  });

  it("totalReturn handles short curves", () => {
    expect(totalReturn([])).toBe(0);
    expect(totalReturn(eq([[0, 100]]))).toBe(0);
  });

  it("cagr over one year", () => {
    expect(
      cagr(
        eq([
          [0, 100],
          [YEAR_MS, 110],
        ]),
      ),
    ).toBeCloseTo(0.1, 4);
  });

  it("maxDrawdown picks worst dip", () => {
    expect(
      maxDrawdown(
        eq([
          [0, 100],
          [1, 120],
          [2, 60],
          [3, 80],
        ]),
      ),
    ).toBeCloseTo(0.5, 5);
  });

  it("maxDrawdown is 0 for monotonic curve", () => {
    expect(
      maxDrawdown(
        eq([
          [0, 1],
          [1, 2],
          [2, 3],
        ]),
      ),
    ).toBe(0);
  });

  it("periodReturns returns one less than length", () => {
    const rets = periodReturns(
      eq([
        [0, 100],
        [1, 110],
        [2, 99],
      ]),
    );
    expect(rets).toHaveLength(2);
    expect(rets[0]).toBeCloseTo(0.1, 5);
  });

  it("sharpe handles constant returns as 0", () => {
    expect(sharpe([0.001, 0.001, 0.001])).toBe(0);
  });

  it("sharpe positive for positive trend", () => {
    const rets = [0.01, 0.012, 0.011, 0.013, 0.009];
    expect(sharpe(rets)).toBeGreaterThan(0);
  });

  it("winRate", () => {
    const trades: Trade[] = [
      { entryTimestamp: 0, exitTimestamp: 1, pnl: 5 },
      { entryTimestamp: 0, exitTimestamp: 1, pnl: -3 },
      { entryTimestamp: 0, exitTimestamp: 1, pnl: 2 },
    ];
    expect(winRate(trades)).toBeCloseTo(2 / 3, 5);
  });

  it("profitFactor", () => {
    const trades: Trade[] = [
      { entryTimestamp: 0, exitTimestamp: 1, pnl: 10 },
      { entryTimestamp: 0, exitTimestamp: 1, pnl: -5 },
    ];
    expect(profitFactor(trades)).toBe(2);
  });

  it("profitFactor with no losses is Infinity", () => {
    expect(profitFactor([{ entryTimestamp: 0, exitTimestamp: 1, pnl: 10 }])).toBe(Infinity);
  });

  it("profitFactor empty is 0", () => {
    expect(profitFactor([])).toBe(0);
  });

  it("computeMetrics composes all", () => {
    const m = computeMetrics(
      eq([
        [0, 100],
        [YEAR_MS, 200],
      ]),
      [{ entryTimestamp: 0, exitTimestamp: 1, pnl: 100 }],
    );
    expect(m.totalReturn).toBeCloseTo(1, 5);
    expect(m.tradeCount).toBe(1);
    expect(m.winRate).toBe(1);
    expect(m.avgTradePnl).toBe(100);
  });
});
