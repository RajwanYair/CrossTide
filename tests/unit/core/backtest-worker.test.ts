/**
 * Backtest worker facade tests.
 *
 * In test env Worker is undefined, so runBacktestAsync must fall back to
 * the synchronous runBacktest path. disposeBacktestWorker is a no-op
 * when no worker was created.
 */
import { describe, it, expect } from "vitest";
import { runBacktestAsync, disposeBacktestWorker } from "../../../src/core/backtest-worker";
import type { BacktestConfig } from "../../../src/domain/backtest-engine";
import type { DailyCandle } from "../../../src/types/domain";

function makeCandles(n: number): DailyCandle[] {
  return Array.from({ length: n }, (_, i) => ({
    date: `2024-01-${String(i + 1).padStart(2, "0")}`,
    open: 100 + i,
    high: 105 + i,
    low: 95 + i,
    close: 100 + i + (i % 3 === 0 ? 2 : -1),
    volume: 1_000_000 + i * 100,
  }));
}

describe("backtest-worker (fallback path)", () => {
  it("runBacktestAsync returns a result via synchronous fallback", async () => {
    const config: BacktestConfig = {
      ticker: "TEST",
      initialCapital: 10_000,
      methods: ["RSI", "MACD"],
      windowSize: 20,
    };
    const candles = makeCandles(60);
    const result = await runBacktestAsync(config, candles);
    expect(result).toBeDefined();
    expect(typeof result.totalReturnPercent).toBe("number");
    expect(typeof result.winRate).toBe("number");
    expect(Array.isArray(result.trades)).toBe(true);
  });

  it("disposeBacktestWorker does not throw when no worker exists", () => {
    expect(() => disposeBacktestWorker()).not.toThrow();
  });
});
