import { describe, it, expect } from "vitest";
import {
  gordonGrowthModel,
  twoStageDDM,
  hModelDDM,
  impliedGrowthRate,
  ddmAnalysis,
} from "../../../src/domain/ddm";

describe("ddm", () => {
  describe("gordonGrowthModel", () => {
    it("computes correct value", () => {
      // D0=2, g=5%, r=10% => D1=2.10, P = 2.10/0.05 = 42
      const value = gordonGrowthModel(2, 0.05, 0.1);
      expect(value).toBeCloseTo(42, 0);
    });

    it("returns Infinity when g >= r", () => {
      expect(gordonGrowthModel(2, 0.12, 0.1)).toBe(Infinity);
    });

    it("returns 0 for zero dividend", () => {
      expect(gordonGrowthModel(0, 0.05, 0.1)).toBe(0);
    });

    it("higher growth = higher value", () => {
      const v1 = gordonGrowthModel(2, 0.03, 0.1);
      const v2 = gordonGrowthModel(2, 0.06, 0.1);
      expect(v2).toBeGreaterThan(v1);
    });
  });

  describe("twoStageDDM", () => {
    it("exceeds Gordon model when high growth phase exists", () => {
      const gordon = gordonGrowthModel(2, 0.03, 0.1);
      const twoStage = twoStageDDM(2, 0.15, 0.03, 0.1, 5);
      expect(twoStage).toBeGreaterThan(gordon);
    });

    it("returns Infinity when terminal growth >= discount rate", () => {
      expect(twoStageDDM(2, 0.15, 0.12, 0.1, 5)).toBe(Infinity);
    });

    it("returns 0 for zero dividend", () => {
      expect(twoStageDDM(0, 0.15, 0.03, 0.1, 5)).toBe(0);
    });

    it("converges to Gordon as highGrowthYears → 0", () => {
      const twoStage = twoStageDDM(2, 0.15, 0.05, 0.1, 0);
      const gordon = gordonGrowthModel(2, 0.05, 0.1);
      expect(twoStage).toBeCloseTo(gordon, 0);
    });
  });

  describe("hModelDDM", () => {
    it("exceeds stable Gordon value", () => {
      const stable = gordonGrowthModel(2, 0.03, 0.1);
      const hModel = hModelDDM(2, 0.15, 0.03, 0.1, 5);
      expect(hModel).toBeGreaterThan(stable);
    });

    it("returns 0 for zero dividend", () => {
      expect(hModelDDM(0, 0.15, 0.03, 0.1, 5)).toBe(0);
    });

    it("returns Infinity when longTermGrowth >= discountRate", () => {
      expect(hModelDDM(2, 0.15, 0.12, 0.1, 5)).toBe(Infinity);
    });
  });

  describe("impliedGrowthRate", () => {
    it("recovers growth rate from Gordon model price", () => {
      const price = gordonGrowthModel(2, 0.05, 0.1);
      const implied = impliedGrowthRate(price, 2, 0.1);
      expect(implied).toBeCloseTo(0.05, 2);
    });

    it("returns 0 for zero price", () => {
      expect(impliedGrowthRate(0, 2, 0.1)).toBe(0);
    });
  });

  describe("ddmAnalysis", () => {
    it("positive margin of safety when undervalued", () => {
      const result = ddmAnalysis(30, 2, 0.05, 0.1);
      // Intrinsic = 42, price = 30 => margin > 0
      expect(result.marginOfSafety).toBeGreaterThan(0);
    });

    it("negative margin of safety when overvalued", () => {
      const result = ddmAnalysis(60, 2, 0.05, 0.1);
      expect(result.marginOfSafety).toBeLessThan(0);
    });

    it("dividendYield is correct", () => {
      const result = ddmAnalysis(50, 2, 0.05, 0.1);
      expect(result.dividendYield).toBeCloseTo(0.04, 5);
    });
  });
});
