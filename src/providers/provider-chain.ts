/**
 * Provider chain — tries providers in order, falls back on failure.
 */
import type { DailyCandle } from "../types/domain";
import type {
  MarketDataProvider,
  ProviderDiagnostics,
  Quote,
  SearchResult,
  ProviderHealth,
} from "./types";

type ChainOperation = "quote" | "history" | "search";

const INITIAL_DIAGNOSTICS: ProviderDiagnostics = {
  operation: null,
  selectedProvider: null,
  attemptedProviders: [],
  fallbackUsed: false,
  degraded: false,
  warnings: [],
};

export function createProviderChain(providers: readonly MarketDataProvider[]): MarketDataProvider {
  if (providers.length === 0) throw new Error("Provider chain requires at least one provider");

  let diagnostics: ProviderDiagnostics = INITIAL_DIAGNOSTICS;

  async function tryAll<T>(
    operation: ChainOperation,
    op: (p: MarketDataProvider) => Promise<T>,
  ): Promise<T> {
    let lastError: Error | null = null;
    const attemptedProviders: string[] = [];
    let healthyFailure = false;
    for (const provider of providers) {
      if (!provider.health().available) continue;
      attemptedProviders.push(provider.name);
      try {
        const result = await op(provider);
        diagnostics = {
          operation,
          selectedProvider: provider.name,
          attemptedProviders,
          fallbackUsed: attemptedProviders.length > 1,
          degraded: attemptedProviders.length > 1,
          warnings:
            attemptedProviders.length > 1
              ? [`Primary provider failed; served by ${provider.name}`]
              : [],
        };
        return result;
      } catch (err) {
        healthyFailure = true;
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }
    // If all healthy providers failed, retry unavailable ones as last resort
    for (const provider of providers) {
      if (provider.health().available) continue;
      attemptedProviders.push(provider.name);
      try {
        const result = await op(provider);
        diagnostics = {
          operation,
          selectedProvider: provider.name,
          attemptedProviders,
          fallbackUsed: true,
          degraded: true,
          warnings: [`Provider ${provider.name} served a degraded fallback response`],
        };
        return result;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }
    diagnostics = {
      operation,
      selectedProvider: null,
      attemptedProviders,
      fallbackUsed: attemptedProviders.length > 1,
      degraded: true,
      warnings: [
        healthyFailure
          ? "All available providers failed"
          : "All providers failed, including unavailable providers",
      ],
    };
    throw lastError ?? new Error("All providers failed");
  }

  return {
    name: "chain",

    getQuote(ticker: string): Promise<Quote> {
      return tryAll("quote", (p) => p.getQuote(ticker));
    },

    getHistory(ticker: string, days: number): Promise<readonly DailyCandle[]> {
      return tryAll("history", (p) => p.getHistory(ticker, days));
    },

    search(query: string): Promise<readonly SearchResult[]> {
      return tryAll("search", (p) => p.search(query));
    },

    getDiagnostics(): ProviderDiagnostics {
      return diagnostics;
    },

    health(): ProviderHealth {
      const anyAvailable = providers.some((p) => p.health().available);
      return {
        name: "chain",
        available: anyAvailable,
        lastSuccessAt: null,
        lastErrorAt: null,
        consecutiveErrors: anyAvailable ? 0 : providers.length,
      };
    },
  };
}
