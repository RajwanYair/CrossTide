/**
 * Unit tests for market regime detection (I9).
 */
import { describe, it, expect } from "vitest";
import {
  Regime,
  classifyVix,
  classifyBreadth,
  classifyYieldCurve,
  classifyDollar,
  trendRegime,
  volatilityRegime,
  combinedRegime,
  regimeScore,
  regimeLabel,
  regimeColor,
} from "../../../src/domain/market-regime";
import type { RegimeSignal } from "../../../src/domain/market-regime";

// ── classifyVix ───────────────────────────────────────────────────────────

describe("classifyVix", () => {
  it("low VIX → RiskOn", () => expect(classifyVix(12)).toBe(Regime.RiskOn));
  it("moderate VIX → Neutral", () => expect(classifyVix(17)).toBe(Regime.Neutral));
  it("boundary 15 → Neutral", () => expect(classifyVix(15)).toBe(Regime.Neutral));
  it("elevated VIX → RiskOff", () => expect(classifyVix(25)).toBe(Regime.RiskOff));
  it("boundary 20 → Neutral", () => expect(classifyVix(20)).toBe(Regime.Neutral));
  it("boundary 30 → RiskOff", () => expect(classifyVix(30)).toBe(Regime.RiskOff));
  it("spike VIX → Crisis", () => expect(classifyVix(45)).toBe(Regime.Crisis));
});

// ── classifyBreadth ───────────────────────────────────────────────────────

describe("classifyBreadth", () => {
  it("strong breadth → RiskOn", () => expect(classifyBreadth(2.0)).toBe(Regime.RiskOn));
  it("normal breadth → Neutral", () => expect(classifyBreadth(1.0)).toBe(Regime.Neutral));
  it("weak breadth → RiskOff", () => expect(classifyBreadth(0.5)).toBe(Regime.RiskOff));
  it("very weak → Crisis", () => expect(classifyBreadth(0.2)).toBe(Regime.Crisis));
  it("boundary 1.5 → Neutral", () => expect(classifyBreadth(1.5)).toBe(Regime.Neutral));
  it("boundary 0.8 → Neutral", () => expect(classifyBreadth(0.8)).toBe(Regime.Neutral));
  it("boundary 0.4 → RiskOff", () => expect(classifyBreadth(0.4)).toBe(Regime.RiskOff));
});

// ── classifyYieldCurve ────────────────────────────────────────────────────

describe("classifyYieldCurve", () => {
  it("steep curve → RiskOn", () => expect(classifyYieldCurve(2.0, 4.5)).toBe(Regime.RiskOn)); // 250bps
  it("flat curve → Neutral", () => expect(classifyYieldCurve(3.5, 4.0)).toBe(Regime.Neutral)); // 50bps
  it("slightly inverted → RiskOff", () =>
    expect(classifyYieldCurve(4.2, 4.0)).toBe(Regime.RiskOff)); // -20bps
  it("deeply inverted → Crisis", () => expect(classifyYieldCurve(5.0, 4.0)).toBe(Regime.Crisis)); // -100bps
  it("zero spread → Neutral", () => expect(classifyYieldCurve(4.0, 4.0)).toBe(Regime.Neutral));
});

// ── classifyDollar ────────────────────────────────────────────────────────

describe("classifyDollar", () => {
  it("weakening dollar → RiskOn", () => expect(classifyDollar(-3)).toBe(Regime.RiskOn));
  it("stable dollar → Neutral", () => expect(classifyDollar(0.5)).toBe(Regime.Neutral));
  it("strengthening dollar → RiskOff", () => expect(classifyDollar(3)).toBe(Regime.RiskOff));
  it("strong flight to safety → Crisis", () => expect(classifyDollar(7)).toBe(Regime.Crisis));
  it("boundary -2 → Neutral", () => expect(classifyDollar(-2)).toBe(Regime.Neutral));
  it("boundary +2 → Neutral", () => expect(classifyDollar(2)).toBe(Regime.Neutral));
  it("boundary +5 → RiskOff", () => expect(classifyDollar(5)).toBe(Regime.RiskOff));
});

// ── trendRegime ───────────────────────────────────────────────────────────

describe("trendRegime", () => {
  it("returns Neutral if insufficient data", () => {
    expect(trendRegime([100, 101, 102], 50)).toBe(Regime.Neutral);
  });

  it("strong uptrend → RiskOn", () => {
    const prices = Array.from({ length: 60 }, (_, i) => 100 + i * 2);
    expect(trendRegime(prices, 50)).toBe(Regime.RiskOn);
  });

  it("flat prices → Neutral", () => {
    const prices = Array.from({ length: 60 }, () => 100);
    expect(trendRegime(prices, 50)).toBe(Regime.Neutral);
  });

  it("moderate downtrend → RiskOff", () => {
    const prices = Array.from({ length: 60 }, (_, i) => 110 - i * 0.3);
    expect(trendRegime(prices, 50)).toBe(Regime.RiskOff);
  });

  it("crash → Crisis", () => {
    const prices = Array.from({ length: 60 }, (_, i) => 200 - i * 5);
    expect(trendRegime(prices, 50)).toBe(Regime.Crisis);
  });
});

// ── volatilityRegime ──────────────────────────────────────────────────────

describe("volatilityRegime", () => {
  it("returns Neutral if insufficient data", () => {
    expect(volatilityRegime([0.01])).toBe(Regime.Neutral);
  });

  it("low vol → RiskOn", () => {
    const returns = Array.from({ length: 30 }, (_, i) => (i % 2 === 0 ? 0.001 : -0.001));
    expect(volatilityRegime(returns)).toBe(Regime.RiskOn);
  });

  it("high vol → RiskOff or Crisis", () => {
    const returns = Array.from({ length: 30 }, (_, i) => (i % 2 === 0 ? 0.04 : -0.04));
    const r = volatilityRegime(returns);
    expect([Regime.RiskOff, Regime.Crisis]).toContain(r);
  });
});

// ── combinedRegime ────────────────────────────────────────────────────────

describe("combinedRegime", () => {
  it("returns Neutral for empty signals", () => {
    expect(combinedRegime([])).toBe(Regime.Neutral);
  });

  it("majority vote with equal confidence", () => {
    const signals: RegimeSignal[] = [
      { source: "vix", regime: Regime.RiskOn, confidence: 1 },
      { source: "breadth", regime: Regime.RiskOn, confidence: 1 },
      { source: "dollar", regime: Regime.RiskOff, confidence: 1 },
    ];
    expect(combinedRegime(signals)).toBe(Regime.RiskOn);
  });

  it("weighted vote favours high-confidence signal", () => {
    const signals: RegimeSignal[] = [
      { source: "vix", regime: Regime.RiskOff, confidence: 0.9 },
      { source: "breadth", regime: Regime.RiskOn, confidence: 0.3 },
      { source: "dollar", regime: Regime.RiskOn, confidence: 0.3 },
    ];
    expect(combinedRegime(signals)).toBe(Regime.RiskOff);
  });

  it("single signal wins", () => {
    const signals: RegimeSignal[] = [{ source: "vix", regime: Regime.Crisis, confidence: 0.5 }];
    expect(combinedRegime(signals)).toBe(Regime.Crisis);
  });
});

// ── regimeScore ───────────────────────────────────────────────────────────

describe("regimeScore", () => {
  it("returns 50 for empty signals", () => {
    expect(regimeScore([])).toBe(50);
  });

  it("pure RiskOn → 0", () => {
    const s: RegimeSignal[] = [{ source: "a", regime: Regime.RiskOn, confidence: 1 }];
    expect(regimeScore(s)).toBe(0);
  });

  it("pure Crisis → 100", () => {
    const s: RegimeSignal[] = [{ source: "a", regime: Regime.Crisis, confidence: 1 }];
    expect(regimeScore(s)).toBe(100);
  });

  it("mixed signals → between 0 and 100", () => {
    const s: RegimeSignal[] = [
      { source: "a", regime: Regime.RiskOn, confidence: 1 },
      { source: "b", regime: Regime.Crisis, confidence: 1 },
    ];
    const score = regimeScore(s);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(100);
  });
});

// ── Labels and colours ────────────────────────────────────────────────────

describe("regimeLabel", () => {
  it("RiskOn → Risk-On", () => expect(regimeLabel(Regime.RiskOn)).toBe("Risk-On"));
  it("Neutral → Neutral", () => expect(regimeLabel(Regime.Neutral)).toBe("Neutral"));
  it("RiskOff → Risk-Off", () => expect(regimeLabel(Regime.RiskOff)).toBe("Risk-Off"));
  it("Crisis → Crisis", () => expect(regimeLabel(Regime.Crisis)).toBe("Crisis"));
});

describe("regimeColor", () => {
  it("RiskOn uses success colour", () => expect(regimeColor(Regime.RiskOn)).toContain("success"));
  it("Crisis uses danger colour", () => expect(regimeColor(Regime.Crisis)).toContain("danger"));
  it("returns a string", () => expect(typeof regimeColor(Regime.Neutral)).toBe("string"));
});
