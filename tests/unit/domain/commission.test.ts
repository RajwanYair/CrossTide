import { describe, it, expect } from "vitest";
import {
  calculateCommission,
  applySlippage,
  netTradePnl,
  totalFees,
  DEFAULT_COMMISSION,
  ZERO_COMMISSION,
} from "../../../src/domain/commission";

describe("commission", () => {
  describe("calculateCommission", () => {
    it("returns zero for zero config", () => {
      expect(calculateCommission(100, 110, 10, ZERO_COMMISSION)).toBe(0);
    });

    it("calculates fixed + percentage fees", () => {
      const config = { fixedPerTrade: 5, percentOfValue: 0.001, slippagePct: 0 };
      // entry: 5 + 100*10*0.001 = 5 + 1 = 6
      // exit:  5 + 110*10*0.001 = 5 + 1.1 = 6.1
      const fee = calculateCommission(100, 110, 10, config);
      expect(fee).toBeCloseTo(12.1, 5);
    });
  });

  describe("applySlippage", () => {
    it("increases entry and decreases exit for long", () => {
      const { adjustedEntry, adjustedExit } = applySlippage(100, 110, "long", 0.001);
      expect(adjustedEntry).toBeCloseTo(100.1, 5);
      expect(adjustedExit).toBeCloseTo(109.89, 2);
    });

    it("decreases entry and increases exit for short", () => {
      const { adjustedEntry, adjustedExit } = applySlippage(100, 90, "short", 0.001);
      expect(adjustedEntry).toBeCloseTo(99.9, 5);
      expect(adjustedExit).toBeCloseTo(90.09, 2);
    });

    it("returns same prices when slippage is zero", () => {
      const { adjustedEntry, adjustedExit } = applySlippage(100, 110, "long", 0);
      expect(adjustedEntry).toBe(100);
      expect(adjustedExit).toBe(110);
    });
  });

  describe("netTradePnl", () => {
    it("returns gross pnl with zero commission", () => {
      const pnl = netTradePnl(100, 110, 10, "long", ZERO_COMMISSION);
      expect(pnl).toBe(100); // (110-100)*10
    });

    it("reduces profit with default commission", () => {
      const pnl = netTradePnl(100, 110, 10, "long", DEFAULT_COMMISSION);
      expect(pnl).toBeLessThan(100);
      expect(pnl).toBeGreaterThan(0);
    });

    it("handles short trades correctly", () => {
      const pnl = netTradePnl(110, 100, 10, "short", ZERO_COMMISSION);
      expect(pnl).toBe(100); // (110-100)*10 for short
    });
  });

  describe("totalFees", () => {
    it("returns zero for zero config", () => {
      const trades = [{ entryPrice: 100, exitPrice: 110, quantity: 10, side: "long" as const }];
      expect(totalFees(trades, ZERO_COMMISSION)).toBe(0);
    });

    it("accumulates fees across multiple trades", () => {
      const trades = [
        { entryPrice: 100, exitPrice: 110, quantity: 10, side: "long" as const },
        { entryPrice: 200, exitPrice: 190, quantity: 5, side: "short" as const },
      ];
      const fees = totalFees(trades, DEFAULT_COMMISSION);
      expect(fees).toBeGreaterThan(0);
    });
  });
});
