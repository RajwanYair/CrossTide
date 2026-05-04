import { describe, it, expect } from "vitest";
import {
  historicalVaR,
  cvar,
  parametricVaR,
  cornishFisherVaR,
  tailRiskAnalysis,
} from "../../../src/domain/tail-risk";

// Simulated daily returns with some fat tails
const returns = Array.from({ length: 500 }, (_, i) => {
  const base = Math.sin(i * 0.1) * 0.02;
  // Add occasional large losses
  if (i % 50 === 0) return -0.05;
  return base;
});

describe("tail-risk", () => {
  it("historicalVaR returns positive for mixed returns", () => {
    const var95 = historicalVaR(returns, 0.95);
    expect(var95).toBeGreaterThan(0);
  });

  it("historicalVaR at 99% is >= 95%", () => {
    const var95 = historicalVaR(returns, 0.95);
    const var99 = historicalVaR(returns, 0.99);
    expect(var99).toBeGreaterThanOrEqual(var95);
  });

  it("historicalVaR empty returns 0", () => {
    expect(historicalVaR([])).toBe(0);
  });

  it("cvar is >= VaR", () => {
    const var95 = historicalVaR(returns, 0.95);
    const cvar95 = cvar(returns, 0.95);
    expect(cvar95).toBeGreaterThanOrEqual(var95);
  });

  it("cvar empty returns 0", () => {
    expect(cvar([])).toBe(0);
  });

  it("parametricVaR returns positive", () => {
    const pVar = parametricVaR(returns, 0.95);
    expect(pVar).toBeGreaterThan(0);
  });

  it("parametricVaR empty returns 0", () => {
    expect(parametricVaR([])).toBe(0);
  });

  it("cornishFisherVaR returns positive", () => {
    const cfVar = cornishFisherVaR(returns, 0.95);
    expect(cfVar).toBeGreaterThan(0);
  });

  it("cornishFisherVaR falls back for short series", () => {
    const cfVar = cornishFisherVaR([0.01, -0.02, 0.005], 0.95);
    expect(cfVar).toBeGreaterThanOrEqual(0);
  });

  it("tailRiskAnalysis returns all metrics", () => {
    const result = tailRiskAnalysis(returns);
    expect(result.var95).toBeGreaterThan(0);
    expect(result.cvar95).toBeGreaterThanOrEqual(result.var95);
    expect(result.var99).toBeGreaterThanOrEqual(result.var95);
    expect(result.maxLoss).toBeGreaterThan(0);
    expect(result.tailRatio).toBeGreaterThanOrEqual(1);
  });

  it("tailRiskAnalysis tailRatio > 1 indicates fat tails", () => {
    const result = tailRiskAnalysis(returns);
    expect(result.tailRatio).toBeGreaterThanOrEqual(1);
  });
});
