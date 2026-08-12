/** Shared canonical market-data envelope fixtures for contract tests. */

import type {
  MarketDataEnvelope,
  MarketDataKind,
  MarketDataStatus,
} from "../../src/types/index.js";

export interface MarketDataFixture {
  readonly name: string;
  readonly kind: MarketDataKind;
  readonly status: Exclude<MarketDataStatus, "live">;
  readonly data: unknown;
  readonly source: string;
  readonly warnings: readonly string[];
}

export type ProviderReplayOutcome =
  | { readonly kind: "success"; readonly payload: unknown }
  | { readonly kind: "stale"; readonly payload: unknown }
  | { readonly kind: "partial"; readonly payload: unknown }
  | { readonly kind: "malformed"; readonly payload: unknown }
  | { readonly kind: "timeout"; readonly error: "timeout" }
  | { readonly kind: "quota"; readonly status: 429 }
  | { readonly kind: "disagreement"; readonly payloads: readonly unknown[] };

export interface ProviderReplayFixture {
  readonly name: string;
  readonly outcome: ProviderReplayOutcome;
}

export const PROVIDER_REPLAY_FIXTURES: readonly ProviderReplayFixture[] = [
  { name: "success", outcome: { kind: "success", payload: { price: 180 } } },
  { name: "stale response", outcome: { kind: "stale", payload: { price: 179 } } },
  { name: "partial response", outcome: { kind: "partial", payload: { price: 180 } } },
  { name: "malformed payload", outcome: { kind: "malformed", payload: { price: "unknown" } } },
  { name: "timeout", outcome: { kind: "timeout", error: "timeout" } },
  { name: "quota response", outcome: { kind: "quota", status: 429 } },
  {
    name: "provider disagreement",
    outcome: { kind: "disagreement", payloads: [{ price: 180 }, { price: 181 }] },
  },
];

export function replayProviderFixture(fixture: ProviderReplayFixture): ProviderReplayOutcome {
  return structuredClone(fixture.outcome);
}

export const MARKET_DATA_STATUS_FIXTURES: readonly MarketDataFixture[] = [
  {
    name: "cached quote",
    kind: "quote",
    status: "cached",
    data: { symbol: "AAPL", price: 180 },
    source: "cache",
    warnings: ["Provider response was cached"],
  },
  {
    name: "stale chart",
    kind: "chart",
    status: "stale",
    data: [{ time: "2026-08-11", close: 179 }],
    source: "cache",
    warnings: ["Data is older than the requested freshness window"],
  },
  {
    name: "demo fundamentals",
    kind: "fundamentals",
    status: "demo",
    data: { symbol: "AAPL", peRatio: 28.4 },
    source: "demo",
    warnings: ["Demo data is displayed"],
  },
  {
    name: "partial news",
    kind: "news",
    status: "partial",
    data: [{ headline: "Market update" }],
    source: "yahoo",
    warnings: ["Some provider fields were unavailable"],
  },
];

export function buildMarketDataFixture(fixture: MarketDataFixture): MarketDataEnvelope<unknown> {
  return {
    schemaVersion: "1",
    kind: fixture.kind,
    status: fixture.status,
    data: fixture.data,
    provenance: {
      source: fixture.source,
      fetchedAt: "2026-08-12T12:00:00.000Z",
      asOf: "2026-08-12T11:59:00.000Z",
    },
    warnings: fixture.warnings,
  };
}
