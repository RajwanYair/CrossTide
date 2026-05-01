/**
 * Provider registry — singleton that holds the active provider chain with
 * circuit-breaker-wrapped instances of Yahoo Finance + Finnhub.
 *
 * The registry exposes:
 *   - `getChain()` — the composite MarketDataProvider for data-service consumers.
 *   - `getHealthSnapshot()` — per-provider health stats for the Provider Health card.
 *
 * Finnhub requires an API key. In a browser-only deployment the key is not
 * available, so the Finnhub provider is registered but remains inactive until
 * a key is supplied via `configureFinnhub(apiKey)`. Yahoo Finance is the
 * default primary source via CORS proxy.
 */
import type { MarketDataProvider, ProviderHealth } from "./types";
import type { DailyCandle } from "../types/domain";
import type { Quote, SearchResult } from "./types";
import { createCircuitBreaker } from "../core/circuit-breaker";
import type { CircuitBreaker } from "../core/circuit-breaker";
import { createYahooProvider } from "./yahoo-provider";
import { createFinnhubProvider } from "./finnhub-provider";
import { createProviderChain } from "./provider-chain";

export interface ProviderRegistryEntry {
  readonly provider: MarketDataProvider;
  readonly breaker: CircuitBreaker;
}

export interface HealthSnapshot {
  readonly entries: ReadonlyArray<{
    name: string;
    health: ProviderHealth;
    breakerState: "closed" | "open" | "half-open";
    breakerFailures: number;
  }>;
  readonly capturedAt: number;
}

/** Wrap a provider so every call goes through its circuit breaker. */
function createBreakerAwareProvider(
  inner: MarketDataProvider,
  breaker: CircuitBreaker,
): MarketDataProvider {
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

  return {
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
}

// ---------------------------------------------------------------------------
// Registry singleton
// ---------------------------------------------------------------------------

const registryEntries: ProviderRegistryEntry[] = [];
let chain: MarketDataProvider | null = null;

function buildChain(): MarketDataProvider {
  const providers = registryEntries.map((e) => createBreakerAwareProvider(e.provider, e.breaker));
  return createProviderChain(providers);
}

function ensureChain(): MarketDataProvider {
  if (!chain) chain = buildChain();
  return chain;
}

// Bootstrap: always add Yahoo as the primary provider
(function initRegistry(): void {
  const yahooBreaker = createCircuitBreaker({ failureThreshold: 3, cooldownMs: 60_000 });
  registryEntries.push({ provider: createYahooProvider(), breaker: yahooBreaker });
})();

/**
 * Add the Finnhub provider to the chain using the given API key.
 * Safe to call at any time; re-builds the chain on next access.
 */
export function configureFinnhub(apiKey: string): void {
  // Remove any existing Finnhub entry
  const idx = registryEntries.findIndex((e) => e.provider.name === "finnhub");
  if (idx !== -1) registryEntries.splice(idx, 1);

  const finnhubBreaker = createCircuitBreaker({ failureThreshold: 3, cooldownMs: 60_000 });
  registryEntries.push({
    provider: createFinnhubProvider(apiKey),
    breaker: finnhubBreaker,
  });

  // Invalidate cached chain so it rebuilds with the new provider
  chain = null;
}

/** Return the active provider chain (Yahoo → Finnhub if configured). */
export function getChain(): MarketDataProvider {
  return ensureChain();
}

/** Return a health snapshot for all registered providers. */
export function getHealthSnapshot(): HealthSnapshot {
  const entries = registryEntries.map((e) => {
    const snap = e.breaker.snapshot();
    return {
      name: e.provider.name,
      health: e.provider.health(),
      breakerState: snap.state,
      breakerFailures: snap.failures,
    };
  });
  return { entries, capturedAt: Date.now() };
}
