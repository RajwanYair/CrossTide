/**
 * Cross-Up Detector tests.
 * Test cases ported from Dart: test/domain/cross_up_detector_test.dart
 */
import { describe, it, expect } from "vitest";
import { detectCrossUp } from "../../../src/domain/cross-up-detector";
import type { DailyCandle } from "../../../src/types/domain";

function makeCandles(closes: number[]): DailyCandle[] {
  return closes.map((close, i) => ({
    date: `2024-01-${String(i + 1).padStart(2, "0")}`,
    open: close,
    high: close + 1,
    low: close - 1,
    close,
    volume: 1000,
  }));
}

describe("detectCrossUp", () => {
  it("returns null for insufficient data", () => {
    const candles = makeCandles([100, 101]);
    expect(detectCrossUp(candles, 5)).toBeNull();
  });

  it("detects cross-up: prev close <= prev SMA, curr close > curr SMA", () => {
    // Build scenario: 5 candles for SMA3, close crosses above SMA on last candle
    // SMA3 at index 3: (90+95+100)/3 = 95, close=100 (above)
    // SMA3 at index 2: (85+90+95)/3 = 90, close=95 (above)
    // We need close[t-1] <= SMA[t-1] AND close[t] > SMA[t]
    // candles: [100, 100, 100, 95, 105]
    // SMA3@3: (100+100+95)/3 = 98.33, close[3]=95 => below
    // SMA3@4: (100+95+105)/3 = 100, close[4]=105 => above
    const candles = makeCandles([100, 100, 100, 95, 105]);
    const result = detectCrossUp(candles, 3);
    expect(result).not.toBeNull();
    expect(result?.isCrossUp).toBe(true);
  });

  it("returns false when no cross-up occurs", () => {
    // All closes well above SMA
    const candles = makeCandles([100, 110, 120, 130, 140]);
    const result = detectCrossUp(candles, 3);
    expect(result).not.toBeNull();
    expect(result?.isCrossUp).toBe(false);
  });

  it("returns false when price stays below SMA", () => {
    // Falling prices → always below SMA
    const candles = makeCandles([100, 90, 80, 70, 60]);
    const result = detectCrossUp(candles, 3);
    expect(result).not.toBeNull();
    expect(result?.isCrossUp).toBe(false);
  });

  it("includes correct price and SMA values", () => {
    const candles = makeCandles([100, 100, 100, 95, 105]);
    const result = detectCrossUp(candles, 3);
    expect(result?.currentClose).toBe(105);
    expect(result?.previousClose).toBe(95);
    expect(result?.currentSma).toBe(100); // (100+95+105)/3
  });
});
