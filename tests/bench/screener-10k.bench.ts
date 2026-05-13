/**
 * Load-testing benchmarks — R7: 10K-ticker screener performance.
 *
 * Uses Vitest bench mode to measure throughput on hot-path domain functions.
 * Target: screener filtering + consensus evaluation for 10,000 tickers < 200 ms.
 *
 * Run:  npx vitest bench tests/bench/
 */
import { bench, describe, expect } from "vitest";
import { computeBollingerSeries } from "../../src/domain/bollinger-calculator";
import { evaluateConsensus } from "../../src/domain/consensus-engine";
import { matchesFundamentalFilters } from "../../src/domain/screener-fundamentals";
import type { DailyCandle, FundamentalData, MethodSignal } from "../../src/types/domain";

// ── Helpers: synthetic data generators ────────────────────────────────────────

function generateCandles(count: number): DailyCandle[] {
  const candles: DailyCandle[] = [];
  let price = 100;
  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.5) * 4;
    price = Math.max(1, price + change);
    const high = price + Math.random() * 2;
    const low = price - Math.random() * 2;
    candles.push({
      date: `2024-${String(Math.floor(i / 30) + 1).padStart(2, "0")}-${String((i % 30) + 1).padStart(2, "0")}`,
      open: price - change * 0.5,
      high,
      low: Math.max(0.01, low),
      close: price,
      volume: Math.floor(Math.random() * 10_000_000),
    });
  }
  return candles;
}

const METHODS = [
  "Micho",
  "RSI",
  "MACD",
  "Bollinger",
  "Stochastic",
  "OBV",
  "ADX",
  "CCI",
  "SAR",
  "WilliamsR",
  "MFI",
  "SuperTrend",
] as const;

const DIRECTIONS = ["BUY", "SELL", "NEUTRAL"] as const;

function generateSignals(): MethodSignal[] {
  return METHODS.map((method) => ({
    method,
    direction: DIRECTIONS[Math.floor(Math.random() * 3)]!,
    strength: Math.random(),
  }));
}

const SECTORS = [
  "Technology",
  "Health Care",
  "Financials",
  "Consumer Discretionary",
  "Industrials",
  "Energy",
] as const;

function generateFundamentalData(i: number): FundamentalData {
  return {
    ticker: `T${String(i).padStart(5, "0")}`,
    peRatio: 5 + Math.random() * 50,
    marketCap: 1e7 + Math.random() * 1e12,
    dividendYield: Math.random() * 0.08,
    profitMargin: -0.1 + Math.random() * 0.5,
    priceToBook: 0.5 + Math.random() * 15,
    debtToEquity: Math.random() * 5,
    returnOnEquity: -0.1 + Math.random() * 0.6,
    sector: SECTORS[i % SECTORS.length],
  } as FundamentalData;
}

// ── Pre-generate 10K datasets ─────────────────────────────────────────────────

const TICKER_COUNT = 10_000;
const CANDLE_COUNT = 252; // 1 year of daily candles

const fundamentalDataSet = Array.from({ length: TICKER_COUNT }, (_, i) =>
  generateFundamentalData(i),
);

const signalSets = Array.from({ length: TICKER_COUNT }, () => generateSignals());

// Smaller candle set for Bollinger — 1000 tickers × 252 days
const candleSets = Array.from({ length: 1000 }, () => generateCandles(CANDLE_COUNT));

// ── Benchmarks ────────────────────────────────────────────────────────────────

describe("screener 10K-ticker benchmarks", () => {
  bench(
    "fundamental filter: 10K tickers through 6 constraints",
    () => {
      const filters = {
        maxPe: 30,
        minMarketCap: 1e9,
        minDividendYield: 0.01,
        minProfitMargin: 0.05,
        maxDebtToEquity: 3,
        sector: "Technology",
      };
      let passing = 0;
      for (const data of fundamentalDataSet) {
        if (matchesFundamentalFilters(data, filters)) passing++;
      }
      // Ensure the loop isn't optimized away
      expect(passing).toBeGreaterThanOrEqual(0);
    },
    { time: 2000 },
  );

  bench(
    "consensus evaluation: 10K tickers × 12 methods",
    () => {
      for (let i = 0; i < TICKER_COUNT; i++) {
        evaluateConsensus(`T${i}`, signalSets[i]!);
      }
    },
    { time: 2000 },
  );

  bench(
    "fundamental + consensus pipeline: 10K tickers end-to-end",
    () => {
      const filters = {
        maxPe: 35,
        minMarketCap: 5e8,
        minProfitMargin: 0.0,
      };
      let hits = 0;
      for (let i = 0; i < TICKER_COUNT; i++) {
        if (matchesFundamentalFilters(fundamentalDataSet[i]!, filters)) {
          const result = evaluateConsensus(`T${i}`, signalSets[i]!);
          if (result.direction !== "NEUTRAL") hits++;
        }
      }
      expect(hits).toBeGreaterThanOrEqual(0);
    },
    { time: 2000 },
  );

  bench(
    "bollinger bands: 1K tickers × 252 candles",
    () => {
      for (const candles of candleSets) {
        computeBollingerSeries(candles);
      }
    },
    { time: 2000 },
  );
});
