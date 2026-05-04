/**
 * Property-based tests for indicator calculators (Q14).
 *
 * Uses fast-check to fuzz RSI, MACD, Bollinger, SMA, and EMA calculations
 * with random candle data, verifying mathematical invariants hold for ALL inputs.
 */
import { describe, it } from "vitest";
import * as fc from "fast-check";
import { computeSmaSeries } from "../../../src/domain/sma-calculator";
import { computeEmaSeries } from "../../../src/domain/ema-calculator";
import { computeRsiSeries } from "../../../src/domain/rsi-calculator";
import { computeMacdSeries } from "../../../src/domain/macd-calculator";
import { computeBollingerSeries } from "../../../src/domain/bollinger-calculator";
import type { DailyCandle } from "../../../src/types/domain";

// ── Arbitraries ──────────────────────────────────────────────────────────

/** Arbitrary positive price between 0.01 and 10000. */
const arbPrice = fc.double({ min: 0.01, max: 10000, noNaN: true });

/** Arbitrary DailyCandle with valid OHLCV. */
const arbCandle: fc.Arbitrary<DailyCandle> = fc
  .record({
    o: arbPrice,
    h: arbPrice,
    l: arbPrice,
    c: arbPrice,
    v: fc.integer({ min: 0, max: 1_000_000_000 }),
    day: fc.integer({ min: 0, max: 3000 }),
  })
  .map(({ o, h, l, c, v, day }) => {
    const prices = [o, h, l, c];
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const d = new Date(2020, 0, 1 + day);
    return {
      date: d.toISOString().slice(0, 10),
      open: o,
      high,
      low,
      close: c,
      volume: v,
    };
  });

/** Array of candles (sorted by date). */
function arbCandles(min = 1, max = 200): fc.Arbitrary<DailyCandle[]> {
  return fc
    .array(arbCandle, { minLength: min, maxLength: max })
    .map((arr) => arr.sort((a, b) => a.date.localeCompare(b.date)));
}

// ── SMA Properties ───────────────────────────────────────────────────────

describe("property: SMA", () => {
  it("output length equals input length", () => {
    fc.assert(
      fc.property(arbCandles(1, 100), fc.integer({ min: 1, max: 50 }), (candles, period) => {
        const result = computeSmaSeries(candles, period);
        return result.length === candles.length;
      }),
    );
  });

  it("non-null values are within price range of input", () => {
    fc.assert(
      fc.property(arbCandles(20, 100), (candles) => {
        const result = computeSmaSeries(candles, 10);
        const minPrice = Math.min(...candles.map((c) => c.low));
        const maxPrice = Math.max(...candles.map((c) => c.high));
        for (const pt of result) {
          if (pt.value !== null) {
            if (pt.value < minPrice - 0.01 || pt.value > maxPrice + 0.01) return false;
          }
        }
        return true;
      }),
    );
  });
});

// ── EMA Properties ───────────────────────────────────────────────────────

describe("property: EMA", () => {
  it("output length equals input length", () => {
    fc.assert(
      fc.property(arbCandles(1, 100), fc.integer({ min: 1, max: 50 }), (candles, period) => {
        const result = computeEmaSeries(candles, period);
        return result.length === candles.length;
      }),
    );
  });

  it("non-null EMA values are within price range", () => {
    fc.assert(
      fc.property(arbCandles(20, 100), (candles) => {
        const result = computeEmaSeries(candles, 10);
        const minPrice = Math.min(...candles.map((c) => c.low));
        const maxPrice = Math.max(...candles.map((c) => c.high));
        for (const pt of result) {
          if (pt.value !== null) {
            if (pt.value < minPrice - 0.01 || pt.value > maxPrice + 0.01) return false;
          }
        }
        return true;
      }),
    );
  });
});

// ── RSI Properties ───────────────────────────────────────────────────────

describe("property: RSI", () => {
  it("output length equals input length", () => {
    fc.assert(
      fc.property(arbCandles(1, 100), (candles) => {
        const result = computeRsiSeries(candles, 14);
        return result.length === candles.length;
      }),
    );
  });

  it("RSI values are between 0 and 100 inclusive", () => {
    fc.assert(
      fc.property(arbCandles(30, 100), (candles) => {
        const result = computeRsiSeries(candles, 14);
        for (const pt of result) {
          if (pt.value !== null) {
            if (pt.value < -0.01 || pt.value > 100.01) return false;
          }
        }
        return true;
      }),
    );
  });
});

// ── MACD Properties ──────────────────────────────────────────────────────

describe("property: MACD", () => {
  it("output length equals input length", () => {
    fc.assert(
      fc.property(arbCandles(1, 100), (candles) => {
        const result = computeMacdSeries(candles);
        return result.length === candles.length;
      }),
    );
  });

  it("histogram equals macd minus signal when both non-null", () => {
    fc.assert(
      fc.property(arbCandles(50, 150), (candles) => {
        const result = computeMacdSeries(candles);
        for (const pt of result) {
          if (pt.macd !== null && pt.signal !== null && pt.histogram !== null) {
            if (Math.abs(pt.histogram - (pt.macd - pt.signal)) > 0.0001) return false;
          }
        }
        return true;
      }),
    );
  });
});

// ── Bollinger Bands Properties ───────────────────────────────────────────

describe("property: Bollinger Bands", () => {
  it("output length equals input length", () => {
    fc.assert(
      fc.property(arbCandles(1, 100), (candles) => {
        const result = computeBollingerSeries(candles);
        return result.length === candles.length;
      }),
    );
  });

  it("upper >= middle >= lower when all non-null", () => {
    fc.assert(
      fc.property(arbCandles(30, 100), (candles) => {
        const result = computeBollingerSeries(candles);
        for (const pt of result) {
          if (pt.upper !== null && pt.middle !== null && pt.lower !== null) {
            if (pt.upper < pt.middle - 0.0001 || pt.middle < pt.lower - 0.0001) return false;
          }
        }
        return true;
      }),
    );
  });

  it("bandwidth is non-negative when non-null", () => {
    fc.assert(
      fc.property(arbCandles(30, 100), (candles) => {
        const result = computeBollingerSeries(candles);
        for (const pt of result) {
          if (pt.bandwidth !== null && pt.bandwidth < -0.0001) return false;
        }
        return true;
      }),
    );
  });
});
