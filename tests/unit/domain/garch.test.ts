import { describe, it, expect } from "vitest";
import {
  estimateGarch,
  garchVolatility,
  garchForecast,
  garchAnalysis,
} from "../../../src/domain/garch";

// Simulated returns with volatility clustering
let seed = 7777;
function lcg(): number {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return (seed / 0xffffffff - 0.5) * 2;
}
const returns: number[] = [];
let vol = 0.01;
for (let i = 0; i < 500; i++) {
  vol = Math.sqrt(0.00001 + 0.1 * returns[i - 1]! ** 2 + 0.85 * vol * vol) || 0.01;
  returns.push(lcg() * vol);
}

describe("garch", () => {
  it("estimateGarch returns valid parameters", () => {
    const params = estimateGarch(returns);
    expect(params.omega).toBeGreaterThan(0);
    expect(params.alpha).toBeGreaterThan(0);
    expect(params.alpha).toBeLessThan(1);
    expect(params.beta).toBeGreaterThan(0);
    expect(params.beta).toBeLessThan(1);
  });

  it("estimateGarch persistence < 1", () => {
    const params = estimateGarch(returns);
    expect(params.alpha + params.beta).toBeLessThan(1);
  });

  it("estimateGarch fallback for short series", () => {
    const params = estimateGarch([0.01, -0.02]);
    expect(params.alpha).toBe(0.1);
    expect(params.beta).toBe(0.85);
  });

  it("garchVolatility returns correct length", () => {
    const params = estimateGarch(returns);
    const vols = garchVolatility(returns, params);
    expect(vols).toHaveLength(500);
  });

  it("garchVolatility all positive", () => {
    const params = estimateGarch(returns);
    const vols = garchVolatility(returns, params);
    for (const v of vols) expect(v).toBeGreaterThan(0);
  });

  it("garchVolatility empty returns empty", () => {
    expect(garchVolatility([], { omega: 0.01, alpha: 0.1, beta: 0.85 })).toEqual([]);
  });

  it("garchForecast returns requested steps", () => {
    const params = estimateGarch(returns);
    const forecast = garchForecast(returns, params, 10);
    expect(forecast).toHaveLength(10);
  });

  it("garchForecast converges to long-run vol", () => {
    const params = estimateGarch(returns);
    const forecast = garchForecast(returns, params, 100);
    // Later values should converge
    const diff = Math.abs(forecast[99]! - forecast[98]!);
    expect(diff).toBeLessThan(0.001);
  });

  it("garchAnalysis returns full result", () => {
    const result = garchAnalysis(returns);
    expect(result.params.omega).toBeGreaterThan(0);
    expect(result.conditionalVol).toHaveLength(500);
    expect(result.longRunVol).toBeGreaterThan(0);
    expect(result.persistence).toBeLessThan(1);
    expect(result.halfLife).toBeGreaterThan(0);
  });

  it("garchAnalysis persistence matches alpha+beta", () => {
    const result = garchAnalysis(returns);
    expect(result.persistence).toBeCloseTo(result.params.alpha + result.params.beta);
  });

  it("garchForecast all positive", () => {
    const params = estimateGarch(returns);
    const forecast = garchForecast(returns, params, 5);
    for (const f of forecast) expect(f).toBeGreaterThan(0);
  });
});
