/**
 * Unit tests for candlestick pattern recognition (I2).
 */
import { describe, it, expect } from "vitest";
import {
  bodySize,
  candleRange,
  upperShadow,
  lowerShadow,
  isBullish,
  isDoji,
  isHammer,
  isShootingStar,
  isSpinningTop,
  isMarubozu,
  isBullishEngulfing,
  isBearishEngulfing,
  isMorningStar,
  isEveningStar,
  isThreeWhiteSoldiers,
  isThreeBlackCrows,
  detectAllPatterns,
} from "../../../src/domain/pattern-recognition";
import type { PatternCandle } from "../../../src/domain/pattern-recognition";

// ── Test candles ──────────────────────────────────────────────────────────

const doji: PatternCandle = { open: 100, high: 102, low: 98, close: 100.1 };
const hammer: PatternCandle = { open: 100, high: 101, low: 94, close: 101 };
const shootingStar: PatternCandle = { open: 100, high: 107, low: 99.9, close: 100.2 };
const spinningTop: PatternCandle = { open: 100, high: 104, low: 96, close: 101 };
const bullMarubozu: PatternCandle = { open: 100, high: 110.1, low: 99.9, close: 110 };
const bearMarubozu: PatternCandle = { open: 110, high: 110.1, low: 99.9, close: 100 };

// ── Candle metrics ────────────────────────────────────────────────────────

describe("bodySize", () => {
  it("computes absolute body", () => {
    expect(bodySize({ open: 100, high: 105, low: 95, close: 103 })).toBe(3);
    expect(bodySize({ open: 103, high: 105, low: 95, close: 100 })).toBe(3);
  });
});

describe("candleRange", () => {
  it("computes high - low", () => {
    expect(candleRange({ open: 100, high: 110, low: 90, close: 105 })).toBe(20);
  });
});

describe("upperShadow", () => {
  it("computes distance from top to max(open,close)", () => {
    expect(upperShadow({ open: 100, high: 110, low: 90, close: 105 })).toBe(5);
  });
});

describe("lowerShadow", () => {
  it("computes distance from min(open,close) to low", () => {
    expect(lowerShadow({ open: 100, high: 110, low: 90, close: 105 })).toBe(10);
  });
});

describe("isBullish", () => {
  it("returns true when close >= open", () => {
    expect(isBullish({ open: 100, high: 105, low: 95, close: 103 })).toBe(true);
  });
  it("returns true when close == open", () => {
    expect(isBullish({ open: 100, high: 105, low: 95, close: 100 })).toBe(true);
  });
  it("returns false when close < open", () => {
    expect(isBullish({ open: 103, high: 105, low: 95, close: 100 })).toBe(false);
  });
});

// ── Single-candle patterns ────────────────────────────────────────────────

describe("isDoji", () => {
  it("detects doji with tiny body", () => {
    expect(isDoji(doji)).toBeGreaterThan(0);
  });
  it("returns 1 for perfectly flat candle", () => {
    expect(isDoji({ open: 100, high: 100, low: 100, close: 100 })).toBe(1);
  });
  it("returns 0 for large body candle", () => {
    expect(isDoji({ open: 100, high: 110, low: 90, close: 108 })).toBe(0);
  });
});

describe("isHammer", () => {
  it("detects hammer pattern", () => {
    expect(isHammer(hammer)).toBeGreaterThan(0);
  });
  it("returns 0 for doji (no body)", () => {
    expect(isHammer(doji)).toBe(0);
  });
  it("returns 0 when upper shadow is too large", () => {
    expect(isHammer({ open: 100, high: 106, low: 94, close: 101 })).toBe(0);
  });
  it("returns 0 for flat candle", () => {
    expect(isHammer({ open: 100, high: 100, low: 100, close: 100 })).toBe(0);
  });
});

describe("isShootingStar", () => {
  it("detects shooting star pattern", () => {
    expect(isShootingStar(shootingStar)).toBeGreaterThan(0);
  });
  it("returns 0 for hammer", () => {
    expect(isShootingStar(hammer)).toBe(0);
  });
  it("returns 0 when lower shadow too large", () => {
    expect(isShootingStar({ open: 100, high: 107, low: 94, close: 100 })).toBe(0);
  });
});

describe("isSpinningTop", () => {
  it("detects spinning top", () => {
    expect(isSpinningTop(spinningTop)).toBeGreaterThan(0);
  });
  it("returns 0 for marubozu", () => {
    expect(isSpinningTop(bullMarubozu)).toBe(0);
  });
  it("returns 0 when one shadow is tiny", () => {
    // Upper shadow too small
    expect(isSpinningTop({ open: 100, high: 100.3, low: 96, close: 101 })).toBe(0);
  });
});

describe("isMarubozu", () => {
  it("detects bullish marubozu", () => {
    expect(isMarubozu(bullMarubozu)).toBeGreaterThan(0);
  });
  it("detects bearish marubozu", () => {
    expect(isMarubozu(bearMarubozu)).toBeGreaterThan(0);
  });
  it("returns 0 for doji", () => {
    expect(isMarubozu(doji)).toBe(0);
  });
  it("returns 0 for flat candle", () => {
    expect(isMarubozu({ open: 100, high: 100, low: 100, close: 100 })).toBe(0);
  });
});

// ── Two-candle patterns ───────────────────────────────────────────────────

describe("isBullishEngulfing", () => {
  it("detects bullish engulfing", () => {
    const prev: PatternCandle = { open: 105, high: 106, low: 100, close: 101 }; // bearish
    const curr: PatternCandle = { open: 99, high: 108, low: 99, close: 107 }; // bullish, engulfs
    expect(isBullishEngulfing(prev, curr)).toBeGreaterThan(0);
  });
  it("returns 0 when first candle is bullish", () => {
    const prev: PatternCandle = { open: 100, high: 106, low: 100, close: 105 };
    const curr: PatternCandle = { open: 99, high: 108, low: 99, close: 107 };
    expect(isBullishEngulfing(prev, curr)).toBe(0);
  });
  it("returns 0 when second candle is bearish", () => {
    const prev: PatternCandle = { open: 105, high: 106, low: 100, close: 101 };
    const curr: PatternCandle = { open: 107, high: 108, low: 99, close: 99 };
    expect(isBullishEngulfing(prev, curr)).toBe(0);
  });
});

describe("isBearishEngulfing", () => {
  it("detects bearish engulfing", () => {
    const prev: PatternCandle = { open: 100, high: 106, low: 99, close: 105 }; // bullish
    const curr: PatternCandle = { open: 107, high: 108, low: 98, close: 98 }; // bearish, engulfs
    expect(isBearishEngulfing(prev, curr)).toBeGreaterThan(0);
  });
  it("returns 0 when first is bearish", () => {
    const prev: PatternCandle = { open: 105, high: 106, low: 100, close: 101 };
    const curr: PatternCandle = { open: 107, high: 108, low: 98, close: 98 };
    expect(isBearishEngulfing(prev, curr)).toBe(0);
  });
});

// ── Three-candle patterns ─────────────────────────────────────────────────

describe("isMorningStar", () => {
  it("detects morning star", () => {
    const first: PatternCandle = { open: 110, high: 111, low: 100, close: 101 }; // bearish
    const second: PatternCandle = { open: 100, high: 101, low: 99, close: 100.5 }; // small
    const third: PatternCandle = { open: 101, high: 112, low: 100, close: 108 }; // bullish > midpoint
    expect(isMorningStar(first, second, third)).toBeGreaterThan(0);
  });
  it("returns 0 when first is bullish", () => {
    const first: PatternCandle = { open: 100, high: 111, low: 99, close: 110 };
    const second: PatternCandle = { open: 100, high: 101, low: 99, close: 100.5 };
    const third: PatternCandle = { open: 101, high: 112, low: 100, close: 108 };
    expect(isMorningStar(first, second, third)).toBe(0);
  });
  it("returns 0 when star body is too large", () => {
    const first: PatternCandle = { open: 110, high: 111, low: 100, close: 101 };
    const second: PatternCandle = { open: 98, high: 107, low: 97, close: 106 };
    const third: PatternCandle = { open: 106, high: 112, low: 105, close: 108 };
    expect(isMorningStar(first, second, third)).toBe(0);
  });
});

describe("isEveningStar", () => {
  it("detects evening star", () => {
    const first: PatternCandle = { open: 100, high: 111, low: 99, close: 110 }; // bullish
    const second: PatternCandle = { open: 110, high: 112, low: 109, close: 111 }; // small
    const third: PatternCandle = { open: 109, high: 110, low: 98, close: 100 }; // bearish < midpoint
    expect(isEveningStar(first, second, third)).toBeGreaterThan(0);
  });
  it("returns 0 when first is bearish", () => {
    const first: PatternCandle = { open: 110, high: 111, low: 99, close: 100 };
    const second: PatternCandle = { open: 100, high: 101, low: 99, close: 100.5 };
    const third: PatternCandle = { open: 100, high: 101, low: 90, close: 91 };
    expect(isEveningStar(first, second, third)).toBe(0);
  });
});

describe("isThreeWhiteSoldiers", () => {
  it("detects three white soldiers", () => {
    const a: PatternCandle = { open: 100, high: 105, low: 100, close: 105 };
    const b: PatternCandle = { open: 104, high: 110, low: 104, close: 110 };
    const c: PatternCandle = { open: 109, high: 115, low: 109, close: 115 };
    expect(isThreeWhiteSoldiers(a, b, c)).toBeGreaterThan(0);
  });
  it("returns 0 when a candle is bearish", () => {
    const a: PatternCandle = { open: 105, high: 105, low: 100, close: 100 };
    const b: PatternCandle = { open: 104, high: 110, low: 104, close: 110 };
    const c: PatternCandle = { open: 109, high: 115, low: 109, close: 115 };
    expect(isThreeWhiteSoldiers(a, b, c)).toBe(0);
  });
  it("returns 0 when closes don't increase", () => {
    const a: PatternCandle = { open: 100, high: 110, low: 100, close: 110 };
    const b: PatternCandle = { open: 104, high: 108, low: 104, close: 108 };
    const c: PatternCandle = { open: 109, high: 115, low: 109, close: 115 };
    expect(isThreeWhiteSoldiers(a, b, c)).toBe(0);
  });
});

describe("isThreeBlackCrows", () => {
  it("detects three black crows", () => {
    const a: PatternCandle = { open: 115, high: 115, low: 110, close: 110 };
    const b: PatternCandle = { open: 111, high: 111, low: 105, close: 105 };
    const c: PatternCandle = { open: 106, high: 106, low: 100, close: 100 };
    expect(isThreeBlackCrows(a, b, c)).toBeGreaterThan(0);
  });
  it("returns 0 when a candle is bullish", () => {
    const a: PatternCandle = { open: 110, high: 115, low: 110, close: 115 };
    const b: PatternCandle = { open: 111, high: 111, low: 105, close: 105 };
    const c: PatternCandle = { open: 106, high: 106, low: 100, close: 100 };
    expect(isThreeBlackCrows(a, b, c)).toBe(0);
  });
});

// ── Composite scanner ─────────────────────────────────────────────────────

describe("detectAllPatterns", () => {
  it("returns empty array for empty input", () => {
    expect(detectAllPatterns([])).toEqual([]);
  });

  it("detects single-candle patterns", () => {
    const results = detectAllPatterns([doji]);
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.name === "Doji")).toBe(true);
  });

  it("detects multi-candle patterns in sequence", () => {
    const candles: PatternCandle[] = [
      { open: 105, high: 106, low: 100, close: 101 }, // bearish
      { open: 99, high: 108, low: 99, close: 107 }, // bullish engulfing
    ];
    const results = detectAllPatterns(candles);
    expect(results.some((r) => r.name === "Bullish Engulfing")).toBe(true);
  });

  it("results sorted by index then confidence", () => {
    const candles: PatternCandle[] = [doji, hammer, shootingStar];
    const results = detectAllPatterns(candles);
    for (let i = 1; i < results.length; i++) {
      if (results[i].index === results[i - 1].index) {
        expect(results[i].confidence).toBeLessThanOrEqual(results[i - 1].confidence);
      } else {
        expect(results[i].index).toBeGreaterThan(results[i - 1].index);
      }
    }
  });

  it("all detected patterns have confidence > 0", () => {
    const candles: PatternCandle[] = [doji, hammer, bullMarubozu, shootingStar];
    const results = detectAllPatterns(candles);
    for (const r of results) {
      expect(r.confidence).toBeGreaterThan(0);
    }
  });

  it("all detected patterns have valid type", () => {
    const candles: PatternCandle[] = [doji, hammer, shootingStar, bullMarubozu, bearMarubozu];
    const results = detectAllPatterns(candles);
    const validTypes = new Set(["bullish", "bearish", "neutral"]);
    for (const r of results) {
      expect(validTypes.has(r.type)).toBe(true);
    }
  });
});
