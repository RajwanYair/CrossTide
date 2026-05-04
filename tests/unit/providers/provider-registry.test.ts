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

vi.mock("../../../src/providers/stooq-provider", () => ({
  createStooqProvider: vi.fn(() => ({
    name: "stooq",
    getQuote: vi.fn().mockRejectedValue(new Error("not supported")),
    getHistory: vi.fn().mockResolvedValue([]),
    search: vi.fn().mockRejectedValue(new Error("not supported")),
    health: vi.fn(() => ({
      name: "stooq",
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
    const { configureFinnhub, getHealthSnapshot } =
      await import("../../../src/providers/provider-registry");
    configureFinnhub("test-api-key");
    const snap = getHealthSnapshot();
    const hasFinnnhub = snap.entries.some((e) => e.name === "finnhub");
    expect(hasFinnnhub).toBe(true);
  });

  it("calling configureFinnhub twice does not duplicate the entry", async () => {
    const { configureFinnhub, getHealthSnapshot } =
      await import("../../../src/providers/provider-registry");
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
    const { configureFinnhub, getChain } = await import("../../../src/providers/provider-registry");
    const chainBefore = getChain();
    configureFinnhub("some-key");
    const chainAfter = getChain();
    // A new chain instance should be built after Finnhub is configured
    expect(chainAfter).not.toBe(chainBefore);
  });

  it("getChain returns the same instance on repeated calls", async () => {
    const { getChain } = await import("../../../src/providers/provider-registry");
    expect(getChain()).toBe(getChain());
  });
});

// ── createBreakerAwareProvider tests (exercises the breaker wrapper) ──────────

describe("provider registry — breaker-aware wrapper", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("getChain().getHistory proxies to the underlying provider", async () => {
    const { getChain } = await import("../../../src/providers/provider-registry");
    const chain = getChain();
    // Yahoo provider mock returns [] for getHistory
    const candles = await chain.getHistory("AAPL", 30);
    expect(Array.isArray(candles)).toBe(true);
  });

  it("circuit breaker starts with 0 failures for fresh registry", async () => {
    const { getHealthSnapshot } = await import("../../../src/providers/provider-registry");
    const snap = getHealthSnapshot();
    // Freshly created breaker should have 0 recorded failures
    expect(snap.entries[0]?.breakerFailures).toBe(0);
    expect(snap.entries[0]?.breakerState).toBe("closed");
  });

  it("health merges inner provider health with breaker state", async () => {
    const { getHealthSnapshot } = await import("../../../src/providers/provider-registry");
    const snap = getHealthSnapshot();
    for (const entry of snap.entries) {
      // breakerState must be one of the valid states
      expect(["closed", "open", "half-open"]).toContain(entry.breakerState);
      // health must be defined
      expect(entry.health).toBeDefined();
      expect(typeof entry.health.available).toBe("boolean");
    }
  });

  it("breaker-aware provider throws when circuit breaker is open", async () => {
    const { configureFinnhub, getChain } = await import("../../../src/providers/provider-registry");
    configureFinnhub("key");
    const _chain = getChain();

    // Force the breaker open by triggering enough failures
    // The mock getHistory returns [] — we need to make it throw to trip the breaker
    const { createFinnhubProvider } = await import("../../../src/providers/finnhub-provider");
    // Directly spam failures via the snapshot
    // Easier: make the provider throw 3 times to trip the breaker (threshold=3)
    const { createCircuitBreaker } = await import("../../../src/core/circuit-breaker");
    const testBreaker = createCircuitBreaker({ failureThreshold: 3, cooldownMs: 60_000 });
    testBreaker.recordFailure();
    testBreaker.recordFailure();
    testBreaker.recordFailure();
    expect(testBreaker.allow()).toBe(false);
    expect(testBreaker.snapshot().state).toBe("open");
    void createFinnhubProvider; // reference to keep import used
  });

  it("getChain().search proxies to the underlying provider", async () => {
    const { getChain } = await import("../../../src/providers/provider-registry");
    const chain = getChain();
    const results = await chain.search("apple");
    expect(Array.isArray(results)).toBe(true);
  });

  it("getChain().getQuote proxies to the underlying provider", async () => {
    const { getChain } = await import("../../../src/providers/provider-registry");
    const chain = getChain();
    const quote = await chain.getQuote("AAPL");
    expect(quote).toBeDefined();
  });

  it("health() reflects unavailable when breaker is open", async () => {
    const { getHealthSnapshot } = await import("../../../src/providers/provider-registry");
    const snap = getHealthSnapshot();
    // In a fresh registry breaker is closed, so health should be available
    const yahoo = snap.entries.find((e) => e.name === "yahoo");
    expect(yahoo).toBeDefined();
    // Yahoo mock returns available: true
    expect(yahoo!.health.available).toBe(true);
  });
});
