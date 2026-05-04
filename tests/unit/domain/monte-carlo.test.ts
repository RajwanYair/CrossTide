import { describe, it, expect } from "vitest";
import { runSimulation, estimateParams } from "../../../src/domain/monte-carlo";

describe("monte-carlo", () => {
  const config = {
    initialValue: 10000,
    periods: 12,
    simulations: 1000,
    meanReturn: 0.01,
    stdDev: 0.05,
    seed: 42,
  };

  it("generates correct number of paths", () => {
    const result = runSimulation(config);
    expect(result.paths).toHaveLength(1000);
    expect(result.finalValues).toHaveLength(1000);
  });

  it("each path has correct length", () => {
    const result = runSimulation(config);
    expect(result.paths[0]!).toHaveLength(13); // initial + 12 periods
    expect(result.paths[0]![0]).toBe(10000);
  });

  it("percentiles are ordered", () => {
    const result = runSimulation(config);
    const { p5, p25, p50, p75, p95 } = result.percentiles;
    expect(p5).toBeLessThanOrEqual(p25);
    expect(p25).toBeLessThanOrEqual(p50);
    expect(p50).toBeLessThanOrEqual(p75);
    expect(p75).toBeLessThanOrEqual(p95);
  });

  it("expected value is positive for positive mean", () => {
    const result = runSimulation(config);
    expect(result.expectedValue).toBeGreaterThan(config.initialValue);
  });

  it("probability of loss is between 0 and 1", () => {
    const result = runSimulation(config);
    expect(result.probabilityOfLoss).toBeGreaterThanOrEqual(0);
    expect(result.probabilityOfLoss).toBeLessThanOrEqual(1);
  });

  it("seed produces deterministic results", () => {
    const r1 = runSimulation(config);
    const r2 = runSimulation(config);
    expect(r1.finalValues[0]).toBe(r2.finalValues[0]);
    expect(r1.percentiles.p50).toBe(r2.percentiles.p50);
  });

  it("higher stdDev produces wider distribution", () => {
    const low = runSimulation({ ...config, stdDev: 0.02 });
    const high = runSimulation({ ...config, stdDev: 0.1 });
    const lowSpread = low.percentiles.p95 - low.percentiles.p5;
    const highSpread = high.percentiles.p95 - high.percentiles.p5;
    expect(highSpread).toBeGreaterThan(lowSpread);
  });

  it("zero periods returns initial value", () => {
    const result = runSimulation({ ...config, periods: 0 });
    expect(result.finalValues.every((v) => v === 10000)).toBe(true);
  });

  it("estimateParams from returns", () => {
    const returns = [0.01, 0.02, -0.01, 0.03, 0.0];
    const params = estimateParams(returns);
    expect(params.mean).toBeCloseTo(0.01);
    expect(params.stdDev).toBeGreaterThan(0);
  });

  it("estimateParams empty returns zeros", () => {
    expect(estimateParams([])).toEqual({ mean: 0, stdDev: 0 });
  });

  it("negative mean produces lower expected value", () => {
    const result = runSimulation({ ...config, meanReturn: -0.02 });
    expect(result.expectedValue).toBeLessThan(config.initialValue);
  });
});
