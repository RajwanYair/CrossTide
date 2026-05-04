import { describe, it, expect } from "vitest";
import {
  fibRetracements,
  fibExtensions,
  fibAnalysis,
  nearestFibLevel,
  autoFib,
} from "../../../src/domain/fibonacci";

describe("fibonacci", () => {
  const high = 200;
  const low = 100;

  it("fibRetracements up direction", () => {
    const levels = fibRetracements(high, low, "up");
    expect(levels).toHaveLength(7);
    // 0% retracement = high
    expect(levels[0]!.price).toBe(200);
    // 100% retracement = low
    expect(levels[6]!.price).toBe(100);
    // 50% retracement = midpoint
    expect(levels[3]!.price).toBe(150);
    // 61.8% level
    expect(levels[4]!.price).toBeCloseTo(138.2);
  });

  it("fibRetracements down direction", () => {
    const levels = fibRetracements(high, low, "down");
    // 0% = low, 100% = high (inverse)
    expect(levels[0]!.price).toBe(100);
    expect(levels[6]!.price).toBe(200);
    expect(levels[3]!.price).toBe(150);
  });

  it("fibExtensions up direction", () => {
    const exts = fibExtensions(high, low, "up");
    expect(exts).toHaveLength(6);
    // 100% extension = low + range = 200
    expect(exts[0]!.price).toBe(200);
    // 161.8% extension = low + 1.618 * range = 261.8
    expect(exts[2]!.price).toBeCloseTo(261.8);
  });

  it("fibExtensions down direction", () => {
    const exts = fibExtensions(high, low, "down");
    // 161.8% ext = high - 1.618 * range = 200 - 161.8 = 38.2
    expect(exts[2]!.price).toBeCloseTo(38.2);
  });

  it("fibAnalysis returns both sets", () => {
    const result = fibAnalysis(high, low, "up");
    expect(result.retracements.length).toBe(7);
    expect(result.extensions.length).toBe(6);
    expect(result.direction).toBe("up");
    expect(result.high).toBe(200);
    expect(result.low).toBe(100);
  });

  it("nearestFibLevel finds closest", () => {
    const levels = fibRetracements(high, low, "up");
    const nearest = nearestFibLevel(140, levels);
    expect(nearest).not.toBeNull();
    // 138.2 (61.8%) is closest to 140
    expect(nearest!.price).toBeCloseTo(138.2);
  });

  it("nearestFibLevel returns null for empty", () => {
    expect(nearestFibLevel(100, [])).toBeNull();
  });

  it("autoFib detects uptrend", () => {
    const prices = [100, 120, 140, 180, 200, 190];
    const result = autoFib(prices);
    expect(result).not.toBeNull();
    expect(result!.high).toBe(200);
    expect(result!.low).toBe(100);
    expect(result!.direction).toBe("up");
  });

  it("autoFib detects downtrend", () => {
    const prices = [200, 180, 150, 100, 110];
    const result = autoFib(prices);
    expect(result).not.toBeNull();
    expect(result!.direction).toBe("down");
  });

  it("autoFib returns null for flat", () => {
    expect(autoFib([100, 100, 100])).toBeNull();
  });

  it("autoFib returns null for insufficient data", () => {
    expect(autoFib([100, 200])).toBeNull();
  });
});
