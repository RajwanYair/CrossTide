import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock providers used by the registry
// ---------------------------------------------------------------------------
vi.mock("../../../src/providers/yahoo-provider", () => ({
  createYahooProvider: vi.fn(() => ({
    name: "yahoo",
    getQuote: vi.fn().mockResolvedValue({}),
    getHistory: vi.fn().mockResolvedValue([]),
    search: vi.fn().mockResolvedValue([]),
    health: vi.fn(() => ({
      name: "yahoo",
      available: true,
      lastSuccessAt: null,
      lastErrorAt: null,
      consecutiveErrors: 0,
    })),
  })),
}));

vi.mock("../../../src/providers/finnhub-provider", () => ({
  createFinnhubProvider: vi.fn(() => ({
    name: "finnhub",
    getQuote: vi.fn().mockResolvedValue({}),
    getHistory: vi.fn().mockResolvedValue([]),
    search: vi.fn().mockResolvedValue([]),
    health: vi.fn(() => ({
      name: "finnhub",
      available: true,
      lastSuccessAt: null,
      lastErrorAt: null,
      consecutiveErrors: 0,
    })),
  })),
}));

vi.mock("../../../src/providers/provider-chain", () => ({
  createProviderChain: vi.fn((providers) => ({
    name: "chain",
    getQuote: vi.fn().mockResolvedValue({}),
    getHistory: vi.fn().mockResolvedValue([]),
    search: vi.fn().mockResolvedValue([]),
    health: vi.fn(() => ({ name: "chain", available: true })),
    _providers: providers,
  })),
}));

describe("provider registry", () => {
  // Re-import fresh module each test via factory to avoid state bleed
  beforeEach(() => {
    vi.resetModules();
  });

  it("getChain returns a MarketDataProvider", async () => {
    const { getChain } = await import("../../../src/providers/provider-registry");
    const chain = getChain();
    expect(chain).toBeDefined();
    expect(typeof chain.getHistory).toBe("function");
  });

  it("getHealthSnapshot returns an entry for yahoo by default", async () => {
    const { getHealthSnapshot } = await import("../../../src/providers/provider-registry");
    const snap = getHealthSnapshot();
    expect(snap.entries.length).toBeGreaterThanOrEqual(1);
    expect(snap.entries[0]?.name).toBe("yahoo");
  });

  it("getHealthSnapshot includes capturedAt timestamp", async () => {
    const { getHealthSnapshot } = await import("../../../src/providers/provider-registry");
    const before = Date.now();
    const snap = getHealthSnapshot();
    const after = Date.now();
    expect(snap.capturedAt).toBeGreaterThanOrEqual(before);
    expect(snap.capturedAt).toBeLessThanOrEqual(after);
  });

  it("configureFinnhub adds a finnhub entry", async () => {
    const { configureFinnhub, getHealthSnapshot } = await import(
      "../../../src/providers/provider-registry"
    );
    configureFinnhub("test-api-key");
    const snap = getHealthSnapshot();
    const hasFinnnhub = snap.entries.some((e) => e.name === "finnhub");
    expect(hasFinnnhub).toBe(true);
  });

  it("calling configureFinnhub twice does not duplicate the entry", async () => {
    const { configureFinnhub, getHealthSnapshot } = await import(
      "../../../src/providers/provider-registry"
    );
    configureFinnhub("key-1");
    configureFinnhub("key-2");
    const snap = getHealthSnapshot();
    const finnhubEntries = snap.entries.filter((e) => e.name === "finnhub");
    expect(finnhubEntries.length).toBe(1);
  });

  it("health entry includes breakerState", async () => {
    const { getHealthSnapshot } = await import("../../../src/providers/provider-registry");
    const snap = getHealthSnapshot();
    for (const entry of snap.entries) {
      expect(["closed", "open", "half-open"]).toContain(entry.breakerState);
    }
  });

  it("chain is rebuilt after configureFinnhub", async () => {
    const { configureFinnhub, getChain } = await import(
      "../../../src/providers/provider-registry"
    );
    const chainBefore = getChain();
    configureFinnhub("some-key");
    const chainAfter = getChain();
    // A new chain instance should be built after Finnhub is configured
    expect(chainAfter).not.toBe(chainBefore);
  });
});
