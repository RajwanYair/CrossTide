/**
 * Technical Defaults tests.
 */
import { describe, it, expect } from "vitest";
import { DEFAULTS } from "../../../src/domain/technical-defaults";

describe("DEFAULTS", () => {
  it("has expected RSI thresholds", () => {
    expect(DEFAULTS.rsiOversold).toBe(30);
    expect(DEFAULTS.rsiOverbought).toBe(70);
  });

  it("has expected MACD periods", () => {
    expect(DEFAULTS.macdFastPeriod).toBe(12);
    expect(DEFAULTS.macdSlowPeriod).toBe(26);
    expect(DEFAULTS.macdSignalPeriod).toBe(9);
  });

  it("has expected SMA periods", () => {
    expect(DEFAULTS.sma50Period).toBe(50);
    expect(DEFAULTS.sma150Period).toBe(150);
    expect(DEFAULTS.sma200Period).toBe(200);
  });

  it("has expected Bollinger defaults", () => {
    expect(DEFAULTS.bollingerPeriod).toBe(20);
    expect(DEFAULTS.bollingerMultiplier).toBe(2.0);
  });

  it("has expected MFI thresholds", () => {
    expect(DEFAULTS.mfiOversold).toBe(20);
    expect(DEFAULTS.mfiOverbought).toBe(80);
  });

  it("has expected Williams %R thresholds", () => {
    expect(DEFAULTS.williamsROversold).toBe(-80);
    expect(DEFAULTS.williamsROverbought).toBe(-20);
  });

  it("has expected CCI thresholds", () => {
    expect(DEFAULTS.cciOversold).toBe(-100);
    expect(DEFAULTS.cciOverbought).toBe(100);
  });

  it("has default period of 14", () => {
    expect(DEFAULTS.period).toBe(14);
  });
});
