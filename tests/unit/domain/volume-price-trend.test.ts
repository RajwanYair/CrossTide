import { describe, it, expect } from "vitest";
import { computeVpt } from "../../../src/domain/volume-price-trend";
import { makeCandles } from "../../helpers/candle-factory";

describe("computeVpt", () => {
  it("returns null for insufficient data", () => {
    expect(computeVpt(makeCandles([100]))).toBeNull();
  });

  it("returns correct number of points", () => {
    const candles = makeCandles(Array.from({ length: 30 }, (_, i) => 100 + i));
    const result = computeVpt(candles);
    expect(result).not.toBeNull();
    expect(result!.length).toBe(29); // N-1 points
  });

  it("produces rising VPT for uptrend", () => {
    const candles = makeCandles(Array.from({ length: 30 }, (_, i) => 100 + i * 2));
    const result = computeVpt(candles);
    expect(result).not.toBeNull();
    const last = result![result!.length - 1]!;
    const first = result![0]!;
    expect(last.vpt).toBeGreaterThan(first.vpt);
  });

  it("produces falling VPT for downtrend", () => {
    const candles = makeCandles(Array.from({ length: 30 }, (_, i) => 200 - i * 2));
    const result = computeVpt(candles);
    expect(result).not.toBeNull();
    const last = result![result!.length - 1]!;
    expect(last.vpt).toBeLessThan(0);
  });

  it("includes signal line (EMA)", () => {
    const candles = makeCandles(Array.from({ length: 30 }, (_, i) => 100 + i));
    const result = computeVpt(candles);
    expect(result).not.toBeNull();
    for (const point of result!) {
      expect(point).toHaveProperty("signal");
      expect(typeof point.signal).toBe("number");
    }
  });

  it("VPT is zero when prices don't change", () => {
    const candles = makeCandles(Array.from({ length: 10 }, () => 100));
    const result = computeVpt(candles);
    expect(result).not.toBeNull();
    for (const point of result!) {
      expect(point.vpt).toBe(0);
    }
  });

  it("respects custom signal period", () => {
    const candles = makeCandles(Array.from({ length: 30 }, (_, i) => 100 + i));
    const result5 = computeVpt(candles, { signalPeriod: 5 });
    const result20 = computeVpt(candles, { signalPeriod: 20 });
    expect(result5).not.toBeNull();
    expect(result20).not.toBeNull();
    // Different signal periods → different signal values
    const lastSig5 = result5![result5!.length - 1]!.signal;
    const lastSig20 = result20![result20!.length - 1]!.signal;
    expect(lastSig5).not.toBe(lastSig20);
  });

  it("each point has a date string", () => {
    const candles = makeCandles(Array.from({ length: 10 }, (_, i) => 100 + i));
    const result = computeVpt(candles);
    expect(result).not.toBeNull();
    for (const point of result!) {
      expect(point.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("VPT is cumulative", () => {
    // With consistent price increases, VPT should accelerate
    const candles = makeCandles(Array.from({ length: 20 }, (_, i) => 100 + i * 3));
    const result = computeVpt(candles);
    expect(result).not.toBeNull();
    // Each VPT should be >= previous (all positive returns)
    for (let i = 1; i < result!.length; i++) {
      expect(result![i]!.vpt).toBeGreaterThanOrEqual(result![i - 1]!.vpt);
    }
  });
});
