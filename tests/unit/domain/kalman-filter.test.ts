import { describe, it, expect } from "vitest";
import {
  initKalman,
  kalmanStep,
  kalmanFilter,
  adaptiveKalmanFilter,
  kalmanTrendSignal,
} from "../../../src/domain/kalman-filter";

const uptrend = Array.from({ length: 100 }, (_, i) => 100 + i * 0.5 + Math.sin(i * 0.3) * 2);
const flat = Array.from({ length: 100 }, (_, i) => 100 + Math.sin(i * 0.5) * 3);

describe("kalman-filter", () => {
  it("initKalman sets initial state", () => {
    const state = initKalman(150);
    expect(state.x).toBe(150);
    expect(state.v).toBe(0);
  });

  it("kalmanStep updates state", () => {
    const state = initKalman(100);
    const next = kalmanStep(state, 101, { processNoise: 0.01, measurementNoise: 1 });
    expect(next.x).toBeGreaterThan(100);
    expect(next.x).toBeLessThanOrEqual(101);
  });

  it("kalmanFilter returns correct length", () => {
    const result = kalmanFilter(uptrend);
    expect(result.smoothed).toHaveLength(100);
    expect(result.velocity).toHaveLength(100);
  });

  it("kalmanFilter smoothed follows price", () => {
    const result = kalmanFilter(uptrend);
    // Last smoothed should be close to last price
    const last = uptrend[uptrend.length - 1]!;
    expect(Math.abs(result.smoothed[result.smoothed.length - 1]! - last)).toBeLessThan(10);
  });

  it("kalmanFilter velocity positive for uptrend", () => {
    const result = kalmanFilter(uptrend);
    const avgVel = result.velocity.slice(20).reduce((s, v) => s + v, 0) / 80;
    expect(avgVel).toBeGreaterThan(0);
  });

  it("kalmanFilter empty returns empty", () => {
    const result = kalmanFilter([]);
    expect(result.smoothed).toEqual([]);
  });

  it("adaptiveKalmanFilter returns adaptiveR", () => {
    const result = adaptiveKalmanFilter(uptrend);
    expect(result.adaptiveR).toHaveLength(100);
    expect(result.smoothed).toHaveLength(100);
  });

  it("adaptiveKalmanFilter adapts R over time", () => {
    const result = adaptiveKalmanFilter(uptrend, { processNoise: 0.01, measurementNoise: 1 }, 10);
    // After warmup, R should differ from initial
    const lastR = result.adaptiveR[result.adaptiveR.length - 1]!;
    expect(lastR).not.toBe(1); // should have adapted
  });

  it("kalmanTrendSignal generates signals", () => {
    const result = kalmanFilter(uptrend);
    const signals = kalmanTrendSignal(result.velocity);
    expect(signals).toHaveLength(100);
    // Most signals should be +1 for uptrend
    const upSignals = signals.filter((s) => s === 1).length;
    expect(upSignals).toBeGreaterThan(50);
  });

  it("kalmanTrendSignal flat near zero", () => {
    const result = kalmanFilter(flat);
    const signals = kalmanTrendSignal(result.velocity, 0.3);
    // With high threshold, many should be 0
    const zeros = signals.filter((s) => s === 0).length;
    expect(zeros).toBeGreaterThan(20);
  });

  it("lower processNoise produces smoother output", () => {
    const smooth = kalmanFilter(uptrend, { processNoise: 0.001, measurementNoise: 1 });
    const rough = kalmanFilter(uptrend, { processNoise: 1, measurementNoise: 1 });
    // Compute variance of differences
    const smoothDiffs = smooth.smoothed.slice(1).map((v, i) => Math.abs(v - smooth.smoothed[i]!));
    const roughDiffs = rough.smoothed.slice(1).map((v, i) => Math.abs(v - rough.smoothed[i]!));
    const avgSmooth = smoothDiffs.reduce((s, d) => s + d, 0) / smoothDiffs.length;
    const avgRough = roughDiffs.reduce((s, d) => s + d, 0) / roughDiffs.length;
    expect(avgSmooth).toBeLessThan(avgRough);
  });
});
