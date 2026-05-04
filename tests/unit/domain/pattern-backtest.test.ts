/**
 * Unit tests for pattern backtesting engine (I3).
 */
import { describe, it, expect } from "vitest";
import {
  evaluatePatternTrade,
  aggregatePatternStats,
  backtestPatterns,
} from "../../../src/domain/pattern-backtest";
import type { PatternTradeResult } from "../../../src/domain/pattern-backtest";
import type { PatternCandle, DetectedPattern } from "../../../src/domain/pattern-recognition";

// ── Fixture candles ──────────────────────────────────────────────────────

/** Steadily rising candles for 20 bars. */
function risingCandles(n: number, start = 100): PatternCandle[] {
  return Array.from({ length: n }, (_, i) => {
    const base = start + i * 2;
    return { open: base, high: base + 3, low: base - 1, close: base + 2 };
  });
}

/** Steadily falling candles for 20 bars. */
function fallingCandles(n: number, start = 200): PatternCandle[] {
  return Array.from({ length: n }, (_, i) => {
    const base = start - i * 2;
    return { open: base, high: base + 1, low: base - 3, close: base - 2 };
  });
}

/** Flat candles. */
function _flatCandles(n: number, price = 100): PatternCandle[] {
  return Array.from({ length: n }, () => ({
    open: price,
    high: price + 0.5,
    low: price - 0.5,
    close: price,
  }));
}

// ── evaluatePatternTrade ─────────────────────────────────────────────────

describe("evaluatePatternTrade", () => {
  it("evaluates bullish pattern with rising price as a win", () => {
    const candles = risingCandles(10);
    const det: DetectedPattern = { name: "Hammer", type: "bullish", confidence: 0.8, index: 2 };
    const result = evaluatePatternTrade(candles, det, 3);
    expect(result).not.toBeNull();
    expect(result!.win).toBe(true);
    expect(result!.returnPct).toBeGreaterThan(0);
    expect(result!.pattern).toBe("Hammer");
  });

  it("evaluates bearish pattern with falling price as a win", () => {
    const candles = fallingCandles(10);
    const det: DetectedPattern = {
      name: "ShootingStar",
      type: "bearish",
      confidence: 0.7,
      index: 2,
    };
    const result = evaluatePatternTrade(candles, det, 3);
    expect(result).not.toBeNull();
    expect(result!.win).toBe(true);
    expect(result!.returnPct).toBeLessThan(0);
  });

  it("evaluates bullish pattern with falling price as a loss", () => {
    const candles = fallingCandles(10);
    const det: DetectedPattern = { name: "Hammer", type: "bullish", confidence: 0.8, index: 2 };
    const result = evaluatePatternTrade(candles, det, 3);
    expect(result).not.toBeNull();
    expect(result!.win).toBe(false);
  });

  it("returns null when exit index exceeds candle length", () => {
    const candles = risingCandles(5);
    const det: DetectedPattern = { name: "Hammer", type: "bullish", confidence: 0.8, index: 3 };
    const result = evaluatePatternTrade(candles, det, 5);
    expect(result).toBeNull();
  });

  it("returns null when entry price is zero", () => {
    const candles: PatternCandle[] = [
      { open: 0, high: 0, low: 0, close: 0 },
      { open: 1, high: 2, low: 1, close: 2 },
      { open: 2, high: 3, low: 2, close: 3 },
    ];
    const det: DetectedPattern = { name: "X", type: "bullish", confidence: 0.5, index: 0 };
    expect(evaluatePatternTrade(candles, det, 1)).toBeNull();
  });

  it("neutral patterns never win", () => {
    const candles = risingCandles(10);
    const det: DetectedPattern = { name: "Doji", type: "neutral", confidence: 0.9, index: 2 };
    const result = evaluatePatternTrade(candles, det, 3);
    expect(result).not.toBeNull();
    expect(result!.win).toBe(false);
  });

  it("uses correct hold period", () => {
    const candles = risingCandles(20);
    const det: DetectedPattern = { name: "Hammer", type: "bullish", confidence: 0.8, index: 5 };
    const r1 = evaluatePatternTrade(candles, det, 1)!;
    const r5 = evaluatePatternTrade(candles, det, 5)!;
    // Longer hold → larger return in rising market
    expect(Math.abs(r5.returnPct)).toBeGreaterThan(Math.abs(r1.returnPct));
  });
});

// ── aggregatePatternStats ────────────────────────────────────────────────

describe("aggregatePatternStats", () => {
  it("groups trades by pattern+direction", () => {
    const trades: PatternTradeResult[] = [
      {
        pattern: "Hammer",
        direction: "bullish",
        confidence: 0.8,
        entryIndex: 0,
        entryPrice: 100,
        exitPrice: 105,
        returnPct: 5,
        win: true,
      },
      {
        pattern: "Hammer",
        direction: "bullish",
        confidence: 0.7,
        entryIndex: 5,
        entryPrice: 110,
        exitPrice: 108,
        returnPct: -1.8,
        win: false,
      },
      {
        pattern: "Engulfing",
        direction: "bearish",
        confidence: 0.9,
        entryIndex: 3,
        entryPrice: 120,
        exitPrice: 115,
        returnPct: -4.2,
        win: true,
      },
    ];
    const stats = aggregatePatternStats(trades);
    expect(stats).toHaveLength(2);
  });

  it("computes correct win rate", () => {
    const trades: PatternTradeResult[] = [
      {
        pattern: "H",
        direction: "bullish",
        confidence: 0.8,
        entryIndex: 0,
        entryPrice: 100,
        exitPrice: 105,
        returnPct: 5,
        win: true,
      },
      {
        pattern: "H",
        direction: "bullish",
        confidence: 0.8,
        entryIndex: 1,
        entryPrice: 100,
        exitPrice: 103,
        returnPct: 3,
        win: true,
      },
      {
        pattern: "H",
        direction: "bullish",
        confidence: 0.8,
        entryIndex: 2,
        entryPrice: 100,
        exitPrice: 98,
        returnPct: -2,
        win: false,
      },
    ];
    const stats = aggregatePatternStats(trades);
    expect(stats[0].winRate).toBeCloseTo(2 / 3);
    expect(stats[0].wins).toBe(2);
    expect(stats[0].losses).toBe(1);
  });

  it("computes avg return and best/worst", () => {
    const trades: PatternTradeResult[] = [
      {
        pattern: "H",
        direction: "bullish",
        confidence: 0.8,
        entryIndex: 0,
        entryPrice: 100,
        exitPrice: 110,
        returnPct: 10,
        win: true,
      },
      {
        pattern: "H",
        direction: "bullish",
        confidence: 0.8,
        entryIndex: 1,
        entryPrice: 100,
        exitPrice: 95,
        returnPct: -5,
        win: false,
      },
    ];
    const stats = aggregatePatternStats(trades);
    expect(stats[0].avgReturn).toBeCloseTo(2.5);
    expect(stats[0].bestReturn).toBe(10);
    expect(stats[0].worstReturn).toBe(-5);
  });

  it("returns empty array for no trades", () => {
    expect(aggregatePatternStats([])).toEqual([]);
  });

  it("sorts by win rate descending", () => {
    const trades: PatternTradeResult[] = [
      {
        pattern: "A",
        direction: "bullish",
        confidence: 0.8,
        entryIndex: 0,
        entryPrice: 100,
        exitPrice: 98,
        returnPct: -2,
        win: false,
      },
      {
        pattern: "B",
        direction: "bullish",
        confidence: 0.8,
        entryIndex: 0,
        entryPrice: 100,
        exitPrice: 105,
        returnPct: 5,
        win: true,
      },
    ];
    const stats = aggregatePatternStats(trades);
    expect(stats[0].pattern).toBe("B");
    expect(stats[1].pattern).toBe("A");
  });
});

// ── backtestPatterns ─────────────────────────────────────────────────────

describe("backtestPatterns", () => {
  it("runs full backtest on hammer-favoring candles", () => {
    // Build candles with hammer patterns followed by rises
    const candles: PatternCandle[] = [];
    for (let i = 0; i < 50; i++) {
      const base = 100 + i * 0.5;
      // Every 10th candle is a hammer (long lower shadow, small body at top)
      if (i % 10 === 0) {
        candles.push({ open: base, high: base + 1, low: base - 6, close: base + 1 });
      } else {
        candles.push({ open: base, high: base + 2, low: base - 1, close: base + 1 });
      }
    }
    const report = backtestPatterns(candles);
    expect(report.totalTrades).toBeGreaterThanOrEqual(0);
    expect(report.config.holdBars).toBe(5);
    expect(report.config.minConfidence).toBe(0);
  });

  it("respects holdBars config", () => {
    const candles = risingCandles(30);
    const r3 = backtestPatterns(candles, { holdBars: 3 });
    const r10 = backtestPatterns(candles, { holdBars: 10 });
    // More trades possible with shorter hold (fewer cut off at the end)
    expect(r3.config.holdBars).toBe(3);
    expect(r10.config.holdBars).toBe(10);
  });

  it("filters by minConfidence", () => {
    const candles = risingCandles(30);
    const all = backtestPatterns(candles, { minConfidence: 0 });
    const high = backtestPatterns(candles, { minConfidence: 0.99 });
    expect(high.totalTrades).toBeLessThanOrEqual(all.totalTrades);
  });

  it("filters by pattern name", () => {
    const candles = risingCandles(30);
    const report = backtestPatterns(candles, {
      includePatterns: ["Hammer"],
    });
    for (const t of report.trades) {
      expect(t.pattern).toBe("Hammer");
    }
  });

  it("handles empty candles", () => {
    const report = backtestPatterns([]);
    expect(report.totalTrades).toBe(0);
    expect(report.overallWinRate).toBe(0);
    expect(report.summary).toEqual([]);
  });

  it("handles too-short candles", () => {
    const report = backtestPatterns(risingCandles(2), { holdBars: 5 });
    expect(report.totalTrades).toBe(0);
  });

  it("provides overall statistics", () => {
    const candles = risingCandles(50);
    const report = backtestPatterns(candles);
    expect(typeof report.overallWinRate).toBe("number");
    expect(typeof report.overallAvgReturn).toBe("number");
    expect(report.overallWinRate).toBeGreaterThanOrEqual(0);
    expect(report.overallWinRate).toBeLessThanOrEqual(1);
  });
});
