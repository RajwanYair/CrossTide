/** Property-based invariants for indicators and backtest metrics. */
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { computeRsiSeries } from "../../../src/domain/rsi-calculator";
import { maxDrawdown, periodReturns, type EquityPoint } from "../../../src/domain/backtest-metrics";
import { computeTradeCost } from "../../../src/domain/backtest-engine";
import type { DailyCandle } from "../../../src/types/domain";

const finitePrice = fc.double({ min: 1, max: 10_000, noNaN: true });
const prices = fc.array(finitePrice, { minLength: 16, maxLength: 80 });

function candles(values: readonly number[]): DailyCandle[] {
  return values.map((close, index) => ({
    date: `2026-01-${String(index + 1).padStart(2, "0")}`,
    open: close,
    high: close,
    low: close,
    close,
    volume: 1_000,
  }));
}

describe("financial invariants", () => {
  it("keeps RSI within its published bounds", () => {
    fc.assert(
      fc.property(prices, (values) => {
        for (const point of computeRsiSeries(candles(values), 14)) {
          if (point.value !== null) {
            expect(point.value).toBeGreaterThanOrEqual(0);
            expect(point.value).toBeLessThanOrEqual(100);
          }
        }
      }),
    );
  });

  it("keeps drawdown bounded and period returns aligned", () => {
    fc.assert(
      fc.property(
        fc.array(fc.double({ min: 1, max: 1_000_000, noNaN: true }), {
          minLength: 2,
          maxLength: 80,
        }),
        (values) => {
          const curve: EquityPoint[] = values.map((value, index) => ({ timestamp: index, value }));
          expect(maxDrawdown(curve)).toBeGreaterThanOrEqual(0);
          expect(maxDrawdown(curve)).toBeLessThanOrEqual(1);
          expect(periodReturns(curve)).toHaveLength(curve.length - 1);
        },
      ),
    );
  });

  it("makes non-negative trading costs monotonic with commission settings", () => {
    fc.assert(
      fc.property(
        finitePrice,
        fc.double({ min: 1, max: 1_000, noNaN: true }),
        fc.double({ min: 0, max: 0.01, noNaN: true }),
        (price, shares, percent) => {
          const base = computeTradeCost(price, shares, {});
          const charged = computeTradeCost(price, shares, { percentPerTrade: percent });
          expect(base).toBe(0);
          expect(charged).toBeGreaterThanOrEqual(base);
        },
      ),
    );
  });
});
