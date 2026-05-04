import { describe, it, expect } from "vitest";
import {
  informationRatio,
  trackingError,
  activeReturn,
  treynorRatio,
  computeBeta,
  mSquared,
  performanceAttribution,
} from "../../../src/domain/information-ratio";

// Portfolio outperforms benchmark slightly
const n = 252;
const benchmarkReturns = Array.from({ length: n }, (_, i) => 0.0004 + Math.sin(i * 0.1) * 0.01);
const portfolioReturns = benchmarkReturns.map((r, i) => r + 0.0002 + Math.cos(i * 0.3) * 0.005);

describe("information-ratio", () => {
  it("informationRatio is positive for outperforming portfolio", () => {
    const ir = informationRatio(portfolioReturns, benchmarkReturns);
    expect(ir).toBeGreaterThan(0);
  });

  it("informationRatio returns 0 for short input", () => {
    expect(informationRatio([0.01], [0.005])).toBe(0);
  });

  it("trackingError is positive", () => {
    const te = trackingError(portfolioReturns, benchmarkReturns);
    expect(te).toBeGreaterThan(0);
  });

  it("trackingError is zero for identical series", () => {
    const te = trackingError(benchmarkReturns, benchmarkReturns);
    expect(te).toBeCloseTo(0);
  });

  it("activeReturn is positive for outperformer", () => {
    const ar = activeReturn(portfolioReturns, benchmarkReturns);
    expect(ar).toBeGreaterThan(0);
  });

  it("computeBeta near 1 for correlated portfolio", () => {
    const beta = computeBeta(portfolioReturns, benchmarkReturns);
    expect(beta).toBeGreaterThan(0.5);
    expect(beta).toBeLessThan(2);
  });

  it("computeBeta returns 0 for short input", () => {
    expect(computeBeta([0.01], [0.005])).toBe(0);
  });

  it("treynorRatio is finite", () => {
    const tr = treynorRatio(portfolioReturns, benchmarkReturns);
    expect(Number.isFinite(tr)).toBe(true);
  });

  it("mSquared is a return value", () => {
    const m2 = mSquared(portfolioReturns, benchmarkReturns);
    expect(Number.isFinite(m2)).toBe(true);
  });

  it("performanceAttribution returns all metrics", () => {
    const result = performanceAttribution(portfolioReturns, benchmarkReturns);
    expect(result.informationRatio).toBeGreaterThan(0);
    expect(result.trackingError).toBeGreaterThan(0);
    expect(result.activeReturn).toBeGreaterThan(0);
    expect(Number.isFinite(result.treynorRatio)).toBe(true);
    expect(result.beta).toBeGreaterThan(0);
    expect(Number.isFinite(result.mSquared)).toBe(true);
  });
});
