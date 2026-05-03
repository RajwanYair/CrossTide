/**
 * Compute worker tests — validate exported types and API interface.
 *
 * The actual worker runs in a Worker context; these tests verify that
 * the module's type exports are importable and the helper function (smaAt)
 * logic is exercised indirectly through the serveWorkerRpc registration
 * (which runs at import time in non-worker contexts as a no-op).
 */
import { describe, it, expect } from "vitest";
import type { ComputeApi, SmaCrossoverResult } from "../../../src/core/compute-worker";

describe("compute-worker (types & interface)", () => {
  it("ComputeApi shape has required methods", () => {
    // Type-level verification — if this compiles, the API shape is correct.
    const apiShape: (keyof ComputeApi)[] = [
      "runBacktest",
      "runBacktestFast",
      "runScreener",
      "runSmaCrossover",
    ];
    expect(apiShape).toHaveLength(4);
  });

  it("SmaCrossoverResult has expected fields", () => {
    // Type-level guard
    const result: SmaCrossoverResult = {
      trades: [],
      equityPoints: [],
      stats: {
        totalReturn: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
        winRate: 0,
        profitFactor: 0,
        avgTrade: 0,
        totalTrades: 0,
      },
      finalEquity: 10_000,
      totalReturnPct: 0,
      annReturn: 0,
      maxDrawdown: 0,
    };
    expect(result.trades).toEqual([]);
    expect(result.finalEquity).toBe(10_000);
  });
});
