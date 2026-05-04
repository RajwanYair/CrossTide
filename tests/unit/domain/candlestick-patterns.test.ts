import { describe, it, expect } from "vitest";
import {
  isDoji,
  isHammer,
  isShootingStar,
  isEngulfing,
  isMarubozu,
  scanPatterns,
  filterByType,
  lastPattern,
} from "../../../src/domain/candlestick-patterns";

describe("candlestick-patterns", () => {
  it("isDoji detects small body relative to range", () => {
    expect(isDoji({ open: 100, high: 110, low: 90, close: 100.5 })).toBe(true);
    expect(isDoji({ open: 90, high: 110, low: 90, close: 110 })).toBe(false);
  });

  it("isHammer detects long lower shadow with small body at top", () => {
    // Body: 100-101=1, lower shadow: 100-90=10, upper: 102-101=1
    expect(isHammer({ open: 100, high: 102, low: 90, close: 101 })).toBe(true);
    expect(isHammer({ open: 100, high: 110, low: 99, close: 101 })).toBe(false);
  });

  it("isShootingStar detects long upper shadow with small body at bottom", () => {
    // Body: 101-100=1, upper shadow: 110-101=9, lower: 100-99=1
    expect(isShootingStar({ open: 101, high: 110, low: 99, close: 100 })).toBe(true);
    expect(isShootingStar({ open: 100, high: 101, low: 90, close: 100.5 })).toBe(false);
  });

  it("isEngulfing detects bullish engulfing", () => {
    const prev = { open: 105, high: 106, low: 99, close: 100 }; // bearish
    const curr = { open: 99, high: 108, low: 98, close: 107 }; // bullish, engulfs
    expect(isEngulfing(prev, curr)).toBe("bullish");
  });

  it("isEngulfing detects bearish engulfing", () => {
    const prev = { open: 100, high: 106, low: 99, close: 105 }; // bullish
    const curr = { open: 106, high: 107, low: 98, close: 99 }; // bearish, engulfs
    expect(isEngulfing(prev, curr)).toBe("bearish");
  });

  it("isEngulfing returns null for non-engulfing", () => {
    const prev = { open: 100, high: 105, low: 99, close: 103 };
    const curr = { open: 102, high: 104, low: 101, close: 103.5 };
    expect(isEngulfing(prev, curr)).toBeNull();
  });

  it("isMarubozu detects full-body candle", () => {
    expect(isMarubozu({ open: 100, high: 110, low: 100, close: 110 })).toBe(true);
    expect(isMarubozu({ open: 100, high: 120, low: 80, close: 105 })).toBe(false);
  });

  it("scanPatterns finds multiple patterns in series", () => {
    const candles = [
      { open: 105, high: 106, low: 99, close: 100 }, // bearish
      { open: 99, high: 108, low: 98, close: 107 }, // bullish engulfing
      { open: 107, high: 115, low: 106, close: 107.5 }, // doji-like
    ];
    const patterns = scanPatterns(candles);
    expect(patterns.length).toBeGreaterThan(0);
    const engulfing = patterns.find((p) => p.pattern === "bullish-engulfing");
    expect(engulfing).toBeDefined();
  });

  it("filterByType filters correctly", () => {
    const candles = [
      { open: 100, high: 110, low: 100, close: 110 }, // bullish marubozu
      { open: 110, high: 110, low: 100, close: 100 }, // bearish marubozu
    ];
    const patterns = scanPatterns(candles);
    const bullish = filterByType(patterns, "bullish");
    expect(bullish.every((p) => p.type === "bullish")).toBe(true);
  });

  it("lastPattern returns most recent", () => {
    const patterns = [
      { index: 0, pattern: "doji", type: "neutral" as const, confidence: 0.6 },
      { index: 5, pattern: "hammer", type: "bullish" as const, confidence: 0.7 },
    ];
    expect(lastPattern(patterns)!.pattern).toBe("hammer");
  });

  it("lastPattern returns null for empty", () => {
    expect(lastPattern([])).toBeNull();
  });
});
