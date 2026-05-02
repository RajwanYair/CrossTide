/**
 * Extended consensus engine tests — edge cases and deeper coverage.
 */
import { describe, it, expect } from "vitest";
import { evaluateConsensus } from "../../../src/domain/consensus-engine";
import type { MethodSignal, MethodName } from "../../../src/types/domain";

const ALL_METHODS: MethodName[] = [
  "Micho",
  "RSI",
  "MACD",
  "Bollinger",
  "Stochastic",
  "OBV",
  "ADX",
  "CCI",
  "SAR",
  "WilliamsR",
  "MFI",
  "SuperTrend",
];

function sig(method: MethodName, direction: "BUY" | "SELL" | "NEUTRAL"): MethodSignal {
  return {
    ticker: "AAPL",
    method,
    direction,
    description: `${method} ${direction}`,
    currentClose: 150,
    evaluatedAt: "2025-01-01",
  };
}

describe("consensus-engine extended", () => {
  it("strength is 1.0 when all 12 methods BUY", () => {
    const signals = ALL_METHODS.map((m) => sig(m, "BUY"));
    const result = evaluateConsensus("AAPL", signals);
    expect(result.direction).toBe("BUY");
    expect(result.strength).toBe(1);
  });

  it("strength is 1.0 when all 12 methods SELL", () => {
    const signals = ALL_METHODS.map((m) => sig(m, "SELL"));
    const result = evaluateConsensus("AAPL", signals);
    expect(result.direction).toBe("SELL");
    expect(result.strength).toBe(1);
  });

  it("Micho SELL + RSI SELL = SELL direction", () => {
    const result = evaluateConsensus("AAPL", [sig("Micho", "SELL"), sig("RSI", "SELL")]);
    expect(result.direction).toBe("SELL");
    expect(result.sellMethods).toHaveLength(2);
  });

  it("NEUTRAL when Micho NEUTRAL and others BUY", () => {
    const signals = [sig("Micho", "NEUTRAL"), sig("RSI", "BUY"), sig("MACD", "BUY")];
    const result = evaluateConsensus("AAPL", signals);
    expect(result.direction).toBe("NEUTRAL");
  });

  it("NEUTRAL when Micho BUY but no supporting secondary", () => {
    const result = evaluateConsensus("AAPL", [sig("Micho", "BUY")]);
    expect(result.direction).toBe("NEUTRAL");
  });

  it("strength reflects Micho 3x weight when BUY", () => {
    const signals = [sig("Micho", "BUY"), sig("RSI", "BUY"), sig("MACD", "BUY")];
    const result = evaluateConsensus("AAPL", signals);
    expect(result.direction).toBe("BUY");
    // Micho weight=3, + 2 others (1 each) = 5, total weighted = 14
    expect(result.strength).toBeCloseTo(5 / 14);
  });

  it("result contains correct ticker", () => {
    const result = evaluateConsensus("GOOG", [sig("Micho", "BUY"), sig("RSI", "BUY")]);
    expect(result.ticker).toBe("GOOG");
  });

  it("buyMethods includes only BUY signals", () => {
    const signals = [sig("Micho", "BUY"), sig("RSI", "BUY"), sig("MACD", "SELL")];
    const result = evaluateConsensus("AAPL", signals);
    expect(result.buyMethods.every((m) => m.direction === "BUY")).toBe(true);
  });

  it("sellMethods includes only SELL signals", () => {
    const signals = [sig("Micho", "SELL"), sig("RSI", "SELL"), sig("MACD", "BUY")];
    const result = evaluateConsensus("AAPL", signals);
    expect(result.sellMethods.every((m) => m.direction === "SELL")).toBe(true);
  });

  it("handles mixed signals correctly (more BUY than SELL)", () => {
    const signals = [
      sig("Micho", "BUY"),
      sig("RSI", "BUY"),
      sig("MACD", "SELL"),
      sig("Bollinger", "NEUTRAL"),
    ];
    const result = evaluateConsensus("AAPL", signals);
    expect(result.direction).toBe("BUY");
  });

  it("handles duplicate method signals", () => {
    const signals = [sig("Micho", "BUY"), sig("RSI", "BUY"), sig("RSI", "BUY")];
    const result = evaluateConsensus("AAPL", signals);
    expect(result.direction).toBe("BUY");
  });
});

// ─────────────────────────── G20: Per-method weight overrides ────────────────

describe("consensus-engine — custom MethodWeights (G20)", () => {
  it("weight=0 for Micho disables it → NEUTRAL even with BUY signals", () => {
    const signals = [sig("Micho", "BUY"), sig("RSI", "BUY"), sig("MACD", "BUY")];
    const result = evaluateConsensus("AAPL", signals, { Micho: 0 });
    expect(result.direction).toBe("NEUTRAL");
  });

  it("weight=0 for Micho disables it → NEUTRAL even with SELL signals", () => {
    const signals = [sig("Micho", "SELL"), sig("RSI", "SELL"), sig("MACD", "SELL")];
    const result = evaluateConsensus("AAPL", signals, { Micho: 0 });
    expect(result.direction).toBe("NEUTRAL");
  });

  it("weight=2 for RSI correctly raises buy strength", () => {
    const noWeights = evaluateConsensus("AAPL", [sig("Micho", "BUY"), sig("RSI", "BUY")]);
    const boostedRSI = evaluateConsensus("AAPL", [sig("Micho", "BUY"), sig("RSI", "BUY")], {
      RSI: 2,
    });
    // strength = (Micho + RSI_boosted) / totalWeighted — must be higher when RSI=2
    expect(boostedRSI.strength).toBeGreaterThan(noWeights.strength);
  });

  it("all weights=0 → NEUTRAL regardless of signals", () => {
    const allZero = Object.fromEntries(ALL_METHODS.map((m) => [m, 0])) as Record<
      MethodName,
      number
    >;
    const signals = ALL_METHODS.map((m) => sig(m, "BUY"));
    const result = evaluateConsensus("AAPL", signals, allZero);
    expect(result.direction).toBe("NEUTRAL");
  });

  it("Micho weight=10 increases strength significantly vs default", () => {
    const signals = [sig("Micho", "BUY"), sig("RSI", "BUY")];
    const defaultResult = evaluateConsensus("AAPL", signals);
    const heavyMicho = evaluateConsensus("AAPL", signals, { Micho: 10 });
    expect(heavyMicho.strength).toBeGreaterThan(defaultResult.strength);
  });

  it("custom weights still produce BUY when Micho is active and a secondary confirms", () => {
    const signals = [sig("Micho", "BUY"), sig("MACD", "BUY")];
    const result = evaluateConsensus("AAPL", signals, { Micho: 5, MACD: 3 });
    expect(result.direction).toBe("BUY");
  });

  it("weight=0 for a secondary method does not prevent BUY with another active secondary", () => {
    const signals = [sig("Micho", "BUY"), sig("RSI", "BUY"), sig("MACD", "BUY")];
    // RSI zeroed out but MACD still active — BUY should hold
    const result = evaluateConsensus("AAPL", signals, { RSI: 0 });
    expect(result.direction).toBe("BUY");
  });

  it("strength is in range [0, 1]", () => {
    const signals = ALL_METHODS.map((m) => sig(m, "BUY"));
    const result = evaluateConsensus("AAPL", signals, { Micho: 100 });
    expect(result.strength).toBeGreaterThanOrEqual(0);
    expect(result.strength).toBeLessThanOrEqual(1);
  });
});
