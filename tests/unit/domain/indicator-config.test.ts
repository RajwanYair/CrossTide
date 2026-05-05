import { describe, it, expect } from "vitest";
import {
  validateIndicatorConfig,
  DEFAULT_INDICATOR_CONFIGS,
} from "../../../src/domain/indicator-config";
import type {
  SmaConfig,
  RsiConfig,
  MacdConfig,
  BollingerConfig,
  IndicatorConfig,
} from "../../../src/domain/indicator-config";

describe("DEFAULT_INDICATOR_CONFIGS", () => {
  it("all defaults pass validation", () => {
    for (const [name, cfg] of Object.entries(DEFAULT_INDICATOR_CONFIGS)) {
      const result = validateIndicatorConfig(cfg as IndicatorConfig);
      expect(result.valid, `${name} default config failed: ${result.errors.join(", ")}`).toBe(true);
      expect(result.errors).toHaveLength(0);
    }
  });

  it("RSI defaults have correct band positions", () => {
    expect(DEFAULT_INDICATOR_CONFIGS.RSI.oversold).toBe(30);
    expect(DEFAULT_INDICATOR_CONFIGS.RSI.overbought).toBe(70);
  });

  it("MACD fast < slow", () => {
    expect(DEFAULT_INDICATOR_CONFIGS.MACD.fastPeriod).toBeLessThan(
      DEFAULT_INDICATOR_CONFIGS.MACD.slowPeriod,
    );
  });
});

describe("validateIndicatorConfig — SMA", () => {
  it("passes valid SMA config", () => {
    const cfg: SmaConfig = { type: "SMA", period: 50, enabled: true, color: "#2962ff" };
    expect(validateIndicatorConfig(cfg).valid).toBe(true);
  });

  it("rejects period below minimum (< 2)", () => {
    const cfg: SmaConfig = { type: "SMA", period: 1, enabled: true, color: "#2962ff" };
    const { valid, errors } = validateIndicatorConfig(cfg);
    expect(valid).toBe(false);
    expect(errors[0]).toMatch(/period/);
  });

  it("rejects period above maximum (> 500)", () => {
    const cfg: SmaConfig = { type: "SMA", period: 501, enabled: true, color: "#2962ff" };
    expect(validateIndicatorConfig(cfg).valid).toBe(false);
  });

  it("rejects non-hex color", () => {
    const cfg: SmaConfig = {
      type: "SMA",
      period: 50,
      enabled: true,
      color: "#xyz123" as `#${string}`,
    };
    const { valid, errors } = validateIndicatorConfig(cfg);
    expect(valid).toBe(false);
    expect(errors[0]).toMatch(/color/);
  });

  it("accepts 4-char #RGB color", () => {
    const cfg: SmaConfig = { type: "SMA", period: 50, enabled: true, color: "#fff" };
    expect(validateIndicatorConfig(cfg).valid).toBe(true);
  });
});

describe("validateIndicatorConfig — RSI", () => {
  const base: RsiConfig = {
    type: "RSI",
    period: 14,
    oversold: 30,
    overbought: 70,
    enabled: true,
    color: "#7b1fa2",
  };

  it("passes valid RSI config", () => {
    expect(validateIndicatorConfig(base).valid).toBe(true);
  });

  it("rejects oversold >= overbought", () => {
    const cfg: RsiConfig = { ...base, oversold: 70, overbought: 70 };
    const { valid, errors } = validateIndicatorConfig(cfg);
    expect(valid).toBe(false);
    expect(errors.some((e) => e.includes("oversold"))).toBe(true);
  });

  it("rejects oversold > 49", () => {
    const cfg: RsiConfig = { ...base, oversold: 50 };
    expect(validateIndicatorConfig(cfg).valid).toBe(false);
  });

  it("rejects overbought < 51", () => {
    const cfg: RsiConfig = { ...base, overbought: 50 };
    expect(validateIndicatorConfig(cfg).valid).toBe(false);
  });
});

describe("validateIndicatorConfig — MACD", () => {
  const base: MacdConfig = {
    type: "MACD",
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    enabled: true,
    color: "#0288d1",
    signalColor: "#f57c00",
    histColorPositive: "#26a69a",
    histColorNegative: "#ef5350",
  };

  it("passes valid MACD config", () => {
    expect(validateIndicatorConfig(base).valid).toBe(true);
  });

  it("rejects fastPeriod >= slowPeriod", () => {
    const cfg: MacdConfig = { ...base, fastPeriod: 26, slowPeriod: 26 };
    const { valid, errors } = validateIndicatorConfig(cfg);
    expect(valid).toBe(false);
    expect(errors.some((e) => e.includes("fastPeriod"))).toBe(true);
  });

  it("rejects invalid signalColor hex", () => {
    const cfg: MacdConfig = { ...base, signalColor: "orange" as `#${string}` };
    expect(validateIndicatorConfig(cfg).valid).toBe(false);
  });
});

describe("validateIndicatorConfig — Bollinger", () => {
  const base: BollingerConfig = {
    type: "Bollinger",
    period: 20,
    multiplier: 2.0,
    enabled: true,
    color: "#1565c0",
    upperColor: "#1565c0",
    lowerColor: "#1565c0",
  };

  it("passes valid Bollinger config", () => {
    expect(validateIndicatorConfig(base).valid).toBe(true);
  });

  it("rejects multiplier below 0.5", () => {
    const cfg: BollingerConfig = { ...base, multiplier: 0.4 };
    expect(validateIndicatorConfig(cfg).valid).toBe(false);
  });

  it("rejects multiplier above 5.0", () => {
    const cfg: BollingerConfig = { ...base, multiplier: 5.1 };
    expect(validateIndicatorConfig(cfg).valid).toBe(false);
  });
});

describe("validateIndicatorConfig — ADX, ATR, Stochastic, VWAP", () => {
  it("passes valid ADX config", () => {
    expect(validateIndicatorConfig(DEFAULT_INDICATOR_CONFIGS.ADX).valid).toBe(true);
  });

  it("passes valid ATR config", () => {
    expect(validateIndicatorConfig(DEFAULT_INDICATOR_CONFIGS.ATR).valid).toBe(true);
  });

  it("passes valid Stochastic config", () => {
    expect(validateIndicatorConfig(DEFAULT_INDICATOR_CONFIGS.Stochastic).valid).toBe(true);
  });

  it("passes valid VWAP config", () => {
    expect(validateIndicatorConfig(DEFAULT_INDICATOR_CONFIGS.VWAP).valid).toBe(true);
  });

  it("rejects VWAP with invalid anchor", () => {
    const cfg = { ...DEFAULT_INDICATOR_CONFIGS.VWAP, anchor: "yearly" } as IndicatorConfig;
    expect(validateIndicatorConfig(cfg).valid).toBe(false);
  });

  it("rejects ADX with trendThreshold out of range", () => {
    const cfg = { ...DEFAULT_INDICATOR_CONFIGS.ADX, trendThreshold: 100 } as IndicatorConfig;
    expect(validateIndicatorConfig(cfg).valid).toBe(false);
  });
});
