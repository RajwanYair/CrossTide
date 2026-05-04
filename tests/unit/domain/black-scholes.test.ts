import { describe, it, expect } from "vitest";
import {
  blackScholes,
  callGreeks,
  putGreeks,
  impliedVolatility,
} from "../../../src/domain/black-scholes";

// Standard test case: S=100, K=100, T=1yr, r=5%, σ=20%
const input = { S: 100, K: 100, T: 1, r: 0.05, sigma: 0.2 };

describe("black-scholes", () => {
  it("blackScholes call price is approximately correct", () => {
    const { call } = blackScholes(input);
    // Known BS price for these params: ~10.45
    expect(call).toBeGreaterThan(9);
    expect(call).toBeLessThan(12);
  });

  it("blackScholes put price is approximately correct", () => {
    const { put } = blackScholes(input);
    // Put-call parity: put ≈ call - S + K*e^(-rT) ≈ 10.45 - 100 + 95.12 ≈ 5.57
    expect(put).toBeGreaterThan(4);
    expect(put).toBeLessThan(8);
  });

  it("put-call parity holds", () => {
    const { call, put } = blackScholes(input);
    const parity = call - put;
    const expected = input.S - input.K * Math.exp(-input.r * input.T);
    expect(parity).toBeCloseTo(expected, 2);
  });

  it("blackScholes at expiration returns intrinsic", () => {
    const { call, put } = blackScholes({ S: 110, K: 100, T: 0, r: 0.05, sigma: 0.2 });
    expect(call).toBe(10);
    expect(put).toBe(0);
  });

  it("callGreeks delta is between 0 and 1", () => {
    const g = callGreeks(input);
    expect(g.delta).toBeGreaterThan(0);
    expect(g.delta).toBeLessThan(1);
  });

  it("callGreeks ATM delta near 0.5", () => {
    const g = callGreeks(input);
    expect(g.delta).toBeGreaterThan(0.5);
    expect(g.delta).toBeLessThan(0.7);
  });

  it("callGreeks gamma is positive", () => {
    const g = callGreeks(input);
    expect(g.gamma).toBeGreaterThan(0);
  });

  it("callGreeks vega is positive", () => {
    const g = callGreeks(input);
    expect(g.vega).toBeGreaterThan(0);
  });

  it("putGreeks delta is negative", () => {
    const g = putGreeks(input);
    expect(g.delta).toBeLessThan(0);
    expect(g.delta).toBeGreaterThan(-1);
  });

  it("putGreeks gamma equals callGreeks gamma", () => {
    const cg = callGreeks(input);
    const pg = putGreeks(input);
    expect(pg.gamma).toBeCloseTo(cg.gamma);
  });

  it("impliedVolatility recovers sigma", () => {
    const { call } = blackScholes(input);
    const iv = impliedVolatility(call, input.S, input.K, input.T, input.r, "call");
    expect(iv).toBeCloseTo(0.2, 2);
  });
});
