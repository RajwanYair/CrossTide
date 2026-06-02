/**
 * A8 — Finnhub + circuit-breaker activation integration tests.
 *
 * Exercises the full "provider wrapped in circuit-breaker" path as used by
 * the provider registry: verify the breaker trips after failureThreshold
 * consecutive failures, that subsequent calls are rejected without hitting the
 * provider, and that getHealthSnapshot() reflects the open state.
 *
 * The tests use vi.resetModules() + dynamic import to isolate registry
 * singleton state between cases.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCircuitBreaker } from "../../../src/core/circuit-breaker";
import type { MarketDataProvider, ProviderHealth } from "../../../src/providers/types";
import type { Quote } from "../../../src/providers/types";

// ── Helper: build a mock provider whose calls always reject ──────────────────
function makeFailingProvider(name = "flaky"): MarketDataProvider {
  return {
    name,
    getQuote: vi.fn().mockRejectedValue(new Error(`${name}: fetch failed`)),
    getHistory: vi.fn().mockRejectedValue(new Error(`${name}: fetch failed`)),
    search: vi.fn().mockRejectedValue(new Error(`${name}: fetch failed`)),
    health: vi.fn(
      (): ProviderHealth => ({
        name,
        available: true,
        lastSuccessAt: null,
        lastErrorAt: null,
        consecutiveErrors: 0,
      }),
    ),
  };
}

// ── Helper: build a mock provider whose calls always succeed ─────────────────
function makeSucceedingProvider(name = "healthy"): MarketDataProvider {
  return {
    name,
    getQuote: vi.fn().mockResolvedValue({
      ticker: "AAPL",
      price: 150,
      open: 149,
      high: 152,
      low: 148,
      previousClose: 149,
      volume: 1_000_000,
      timestamp: Date.now(),
    } satisfies Quote),
    getHistory: vi.fn().mockResolvedValue([]),
    search: vi.fn().mockResolvedValue([]),
    health: vi.fn(
      (): ProviderHealth => ({
        name,
        available: true,
        lastSuccessAt: Date.now(),
        lastErrorAt: null,
        consecutiveErrors: 0,
      }),
    ),
  };
}

// ── Inline breaker-aware wrapper (mirrors registry's createBreakerAwareProvider)
import type { DailyCandle } from "../../../src/types/domain";
import type { SearchResult } from "../../../src/providers/types";

function wrapWithBreaker(
  inner: MarketDataProvider,
  failureThreshold: number,
): { wrapped: MarketDataProvider; breakerState: () => string } {
  const breaker = createCircuitBreaker({ failureThreshold, cooldownMs: 60_000 });

  async function call<T>(op: () => Promise<T>): Promise<T> {
    if (!breaker.allow()) {
      throw new Error(`Provider "${inner.name}" circuit breaker is open`);
    }
    try {
      const result = await op();
      breaker.recordSuccess();
      return result;
    } catch (err) {
      breaker.recordFailure();
      throw err;
    }
  }

  const wrapped: MarketDataProvider = {
    name: inner.name,
    getQuote: (ticker: string): Promise<Quote> => call(() => inner.getQuote(ticker)),
    getHistory: (ticker: string, days: number): Promise<readonly DailyCandle[]> =>
      call(() => inner.getHistory(ticker, days)),
    search: (query: string): Promise<readonly SearchResult[]> => call(() => inner.search(query)),
    health: (): ProviderHealth => {
      const snap = breaker.snapshot();
      const innerHealth = inner.health();
      return {
        ...innerHealth,
        available: snap.state !== "open" && innerHealth.available,
      };
    },
  };

  return { wrapped, breakerState: () => breaker.snapshot().state };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("circuit-breaker + provider integration (A8)", () => {
  it("allows calls while circuit is closed", async () => {
    const provider = makeFailingProvider();
    const { wrapped } = wrapWithBreaker(provider, 3);

    // First call should be allowed (and then fail)
    await expect(wrapped.getQuote("AAPL")).rejects.toThrow("fetch failed");
    expect(provider.getQuote).toHaveBeenCalledOnce();
  });

  it("opens circuit after failureThreshold consecutive failures", async () => {
    const provider = makeFailingProvider();
    const { wrapped, breakerState } = wrapWithBreaker(provider, 3);

    for (let i = 0; i < 3; i++) {
      await expect(wrapped.getQuote("AAPL")).rejects.toThrow();
    }

    expect(breakerState()).toBe("open");
  });

  it("rejects calls without reaching provider when circuit is open", async () => {
    const provider = makeFailingProvider();
    const { wrapped } = wrapWithBreaker(provider, 2);

    // Trip the breaker
    await expect(wrapped.getQuote("AAPL")).rejects.toThrow();
    await expect(wrapped.getQuote("AAPL")).rejects.toThrow();

    // Provider was called exactly twice (the threshold)
    const callsBefore = (provider.getQuote as ReturnType<typeof vi.fn>).mock.calls.length;

    // Circuit now open → this call is rejected without hitting the provider
    await expect(wrapped.getQuote("AAPL")).rejects.toThrow("circuit breaker is open");
    expect((provider.getQuote as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callsBefore);
  });

  it("health() reflects open circuit (available=false)", async () => {
    const provider = makeFailingProvider();
    const { wrapped } = wrapWithBreaker(provider, 2);

    await expect(wrapped.getQuote("AAPL")).rejects.toThrow();
    await expect(wrapped.getQuote("AAPL")).rejects.toThrow();

    expect(wrapped.health().available).toBe(false);
  });

  it("health() remains true while circuit is closed", async () => {
    const provider = makeSucceedingProvider();
    const { wrapped } = wrapWithBreaker(provider, 5);

    await wrapped.getQuote("AAPL");
    expect(wrapped.health().available).toBe(true);
  });

  it("records success and keeps circuit closed on successful call", async () => {
    const provider = makeSucceedingProvider();
    const { wrapped, breakerState } = wrapWithBreaker(provider, 3);

    await wrapped.getQuote("AAPL");
    expect(breakerState()).toBe("closed");
  });

  it("resets failure count on success (does not open from mixed calls)", async () => {
    let callCount = 0;
    const provider: MarketDataProvider = {
      name: "mixed",
      getQuote: vi.fn(async (): Promise<Quote> => {
        callCount++;
        // Fail on calls 1 and 2, succeed on call 3
        if (callCount <= 2) throw new Error("fail");
        return {
          ticker: "AAPL",
          price: 100,
          open: 99,
          high: 101,
          low: 98,
          previousClose: 99,
          volume: 1000,
          timestamp: Date.now(),
        };
      }),
      getHistory: vi.fn().mockResolvedValue([]),
      search: vi.fn().mockResolvedValue([]),
      health: vi.fn(
        (): ProviderHealth => ({
          name: "mixed",
          available: true,
          lastSuccessAt: null,
          lastErrorAt: null,
          consecutiveErrors: 0,
        }),
      ),
    };
    const { wrapped, breakerState } = wrapWithBreaker(provider, 3);

    await expect(wrapped.getQuote("AAPL")).rejects.toThrow(); // fail 1
    await expect(wrapped.getQuote("AAPL")).rejects.toThrow(); // fail 2
    await wrapped.getQuote("AAPL"); // success → resets count
    // After success, failures reset; circuit should still be closed
    expect(breakerState()).toBe("closed");
  });

  it("getHistory is also protected by the breaker", async () => {
    const provider = makeFailingProvider();
    const { wrapped } = wrapWithBreaker(provider, 2);

    await expect(wrapped.getHistory("AAPL", 30)).rejects.toThrow();
    await expect(wrapped.getHistory("AAPL", 30)).rejects.toThrow();

    // Circuit open: getHistory should now throw breaker error
    await expect(wrapped.getHistory("AAPL", 30)).rejects.toThrow("circuit breaker is open");
  });

  it("search is also protected by the breaker", async () => {
    const provider = makeFailingProvider();
    const { wrapped } = wrapWithBreaker(provider, 1);

    await expect(wrapped.search("apple")).rejects.toThrow();
    // Breaker now open
    await expect(wrapped.search("apple")).rejects.toThrow("circuit breaker is open");
  });
});

// ── Registry integration: configureFinnhub adds Finnhub to chain ─────────────
describe("registry configureFinnhub activation (A8)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("configureFinnhub adds finnhub to health snapshot", async () => {
    vi.mock("../../../src/providers/yahoo-provider", () => ({
      createYahooProvider: vi.fn(() => makeSucceedingProvider("yahoo")),
    }));
    vi.mock("../../../src/providers/finnhub-provider", () => ({
      createFinnhubProvider: vi.fn((_key: string) => makeSucceedingProvider("finnhub")),
    }));

    const { configureFinnhub, getHealthSnapshot } = await import(
      "../../../src/providers/provider-registry"
    );
    configureFinnhub("test-api-key-xyz");
    const snap = getHealthSnapshot();
    expect(snap.entries.some((e) => e.name === "finnhub")).toBe(true);
  });

  it("finnhub entry starts with closed breaker after configureFinnhub", async () => {
    vi.mock("../../../src/providers/yahoo-provider", () => ({
      createYahooProvider: vi.fn(() => makeSucceedingProvider("yahoo")),
    }));
    vi.mock("../../../src/providers/finnhub-provider", () => ({
      createFinnhubProvider: vi.fn((_key: string) => makeSucceedingProvider("finnhub")),
    }));

    const { configureFinnhub, getHealthSnapshot } = await import(
      "../../../src/providers/provider-registry"
    );
    configureFinnhub("test-api-key");
    const snap = getHealthSnapshot();
    const finnhubEntry = snap.entries.find((e) => e.name === "finnhub");
    expect(finnhubEntry?.breakerState).toBe("closed");
    expect(finnhubEntry?.breakerFailures).toBe(0);
  });
});
