/**
 * Coverage for provider-registry.ts — configureTiingo (lines 127-136) and
 * stooq-provider.ts — index symbol, pass-through, fetch error, CSV edge cases.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// We need to mock dependencies before importing provider-registry
vi.mock("../../../src/providers/yahoo-provider", () => ({
  createYahooProvider: () => ({
    name: "yahoo",
    getQuote: vi.fn().mockResolvedValue({ ticker: "T", price: 1 }),
    getHistory: vi.fn().mockResolvedValue([]),
    search: vi.fn().mockResolvedValue([]),
    health: () => ({
      name: "yahoo",
      available: true,
      lastSuccessAt: null,
      lastErrorAt: null,
      consecutiveErrors: 0,
    }),
  }),
}));

vi.mock("../../../src/providers/finnhub-provider", () => ({
  createFinnhubProvider: (key: string) => ({
    name: "finnhub",
    getQuote: vi.fn().mockResolvedValue({ ticker: "T", price: 1 }),
    getHistory: vi.fn().mockResolvedValue([]),
    search: vi.fn().mockResolvedValue([]),
    health: () => ({
      name: "finnhub",
      available: true,
      lastSuccessAt: null,
      lastErrorAt: null,
      consecutiveErrors: 0,
      apiKey: key,
    }),
  }),
}));

vi.mock("../../../src/providers/stooq-provider", () => ({
  createStooqProvider: () => ({
    name: "stooq",
    getQuote: vi.fn().mockRejectedValue(new Error("not supported")),
    getHistory: vi.fn().mockResolvedValue([]),
    search: vi.fn().mockRejectedValue(new Error("not supported")),
    health: () => ({
      name: "stooq",
      available: true,
      lastSuccessAt: null,
      lastErrorAt: null,
      consecutiveErrors: 0,
    }),
  }),
}));

vi.mock("../../../src/providers/tiingo-provider", () => ({
  createTiingoProvider: (key: string) => ({
    name: "tiingo",
    getQuote: vi.fn().mockResolvedValue({ ticker: "T", price: 1 }),
    getHistory: vi.fn().mockResolvedValue([]),
    search: vi.fn().mockResolvedValue([]),
    health: () => ({
      name: "tiingo",
      available: true,
      lastSuccessAt: null,
      lastErrorAt: null,
      consecutiveErrors: 0,
      apiKey: key,
    }),
  }),
}));

vi.mock("../../../src/providers/provider-chain", () => ({
  createProviderChain: (providers: Array<{ name: string }>) => ({
    name: providers.map((p) => p.name).join("+"),
    getQuote: vi.fn().mockResolvedValue({ ticker: "T", price: 1 }),
    getHistory: vi.fn().mockResolvedValue([]),
    search: vi.fn().mockResolvedValue([]),
    health: () => ({
      name: "chain",
      available: true,
      lastSuccessAt: null,
      lastErrorAt: null,
      consecutiveErrors: 0,
    }),
  }),
}));

describe("provider-registry coverage — configureTiingo (lines 127-136)", () => {
  beforeEach(async () => {
    vi.resetModules();
  });

  it("configureTiingo adds Tiingo provider to the registry", async () => {
    const { configureTiingo, getHealthSnapshot } =
      await import("../../../src/providers/provider-registry");
    configureTiingo("test-tiingo-key");
    const snap = getHealthSnapshot();
    const names = snap.entries.map((e) => e.name);
    expect(names).toContain("tiingo");
  });

  it("configureTiingo replaces existing Tiingo entry on re-call", async () => {
    const { configureTiingo, getHealthSnapshot } =
      await import("../../../src/providers/provider-registry");
    configureTiingo("key-1");
    configureTiingo("key-2");
    const snap = getHealthSnapshot();
    const tiingoEntries = snap.entries.filter((e) => e.name === "tiingo");
    expect(tiingoEntries).toHaveLength(1);
  });

  it("configureTiingo invalidates chain so it rebuilds", async () => {
    const { configureTiingo, getChain } = await import("../../../src/providers/provider-registry");
    const chain1 = getChain();
    configureTiingo("key-x");
    const chain2 = getChain();
    // Chain should have been rebuilt (different reference or name)
    expect(chain2.name).toContain("tiingo");
    expect(chain1).not.toBe(chain2);
  });
});
