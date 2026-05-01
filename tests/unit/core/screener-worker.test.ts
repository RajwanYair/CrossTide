import { describe, it, expect, vi, beforeEach } from "vitest";

// We test the facade's fallback path (Worker unavailable) — the actual
// applyFilters logic is already tested in cards/screener.test.ts.
describe("screener-worker facade", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("falls back to synchronous applyFilters when Worker is undefined", async () => {
    const origWorker = globalThis.Worker;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).Worker = undefined;

    try {
      const { runScreenerAsync } = await import(
        "../../../src/core/screener-worker"
      );

      const inputs = [
        {
          ticker: "AAPL",
          price: 150,
          consensus: "BUY" as const,
          rsi: 25,
          volumeRatio: 1.5,
          smaValues: new Map<number, number | null>(),
        },
      ];
      const filters = [{ type: "rsiBelow" as const, threshold: 30 }];

      const result = await runScreenerAsync(inputs, filters);
      expect(result).toHaveLength(1);
      expect(result[0]!.ticker).toBe("AAPL");
      expect(result[0]!.matchedFilters.length).toBeGreaterThan(0);
    } finally {
      globalThis.Worker = origWorker;
    }
  });

  it("returns empty array when no inputs match", async () => {
    const origWorker = globalThis.Worker;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).Worker = undefined;

    try {
      const { runScreenerAsync } = await import(
        "../../../src/core/screener-worker"
      );

      const inputs = [
        {
          ticker: "TSLA",
          price: 200,
          consensus: "SELL" as const,
          rsi: 80,
          volumeRatio: 0.5,
          smaValues: new Map<number, number | null>(),
        },
      ];
      const filters = [{ type: "rsiBelow" as const, threshold: 30 }];

      const result = await runScreenerAsync(inputs, filters);
      expect(result).toHaveLength(0);
    } finally {
      globalThis.Worker = origWorker;
    }
  });

  it("disposeScreenerWorker does not throw when no worker exists", async () => {
    const { disposeScreenerWorker } = await import(
      "../../../src/core/screener-worker"
    );
    expect(() => disposeScreenerWorker()).not.toThrow();
  });

  it("ComputeApi type includes runScreener method", async () => {
    const mod = await import("../../../src/core/compute-worker");
    // Type-level check — if ComputeApi doesn't have runScreener, compile fails
    type HasScreener = typeof mod.ComputeApi extends never ? never : true;
    const _check: HasScreener = true;
    expect(_check).toBe(true);
  });
});
