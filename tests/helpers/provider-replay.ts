/** Deterministic provider replay scenarios for failure-state tests. */
import type { DailyCandle } from "../../src/types/domain";
import type { MarketDataProvider, ProviderHealth, Quote } from "../../src/providers/types";

export type ReplayScenario =
  | "success"
  | "stale"
  | "malformed"
  | "timeout"
  | "quota"
  | "partial"
  | "disagreement";

export interface ProviderReplay {
  readonly scenario: ReplayScenario;
  readonly primary: Quote | Error;
  readonly fallback: Quote | Error;
}

const BASE_QUOTE: Quote = {
  ticker: "AAPL",
  price: 150.5,
  open: 149,
  high: 152,
  low: 148,
  previousClose: 149,
  volume: 50_000_000,
  timestamp: Date.parse("2026-08-12T12:00:00.000Z"),
};

export const PROVIDER_REPLAYS: readonly ProviderReplay[] = [
  { scenario: "success", primary: BASE_QUOTE, fallback: BASE_QUOTE },
  {
    scenario: "stale",
    primary: { ...BASE_QUOTE, timestamp: Date.parse("2026-08-01T12:00:00.000Z") },
    fallback: BASE_QUOTE,
  },
  { scenario: "malformed", primary: new Error("malformed payload"), fallback: BASE_QUOTE },
  { scenario: "timeout", primary: new Error("upstream timeout"), fallback: BASE_QUOTE },
  { scenario: "quota", primary: new Error("provider quota exceeded"), fallback: BASE_QUOTE },
  {
    scenario: "partial",
    primary: { ...BASE_QUOTE, volume: 0 },
    fallback: BASE_QUOTE,
  },
  {
    scenario: "disagreement",
    primary: BASE_QUOTE,
    fallback: { ...BASE_QUOTE, price: 151.25 },
  },
];

export function createReplayProvider(
  name: string,
  outcome: Quote | Error,
  available = true,
): MarketDataProvider {
  const resolve = <T>(value: T | Error): Promise<T> =>
    value instanceof Error ? Promise.reject(value) : Promise.resolve(value);
  const history: readonly DailyCandle[] = [];
  const health = (): ProviderHealth => ({
    name,
    available,
    lastSuccessAt: available ? Date.parse("2026-08-12T12:00:00.000Z") : null,
    lastErrorAt: available ? null : Date.parse("2026-08-12T11:59:00.000Z"),
    consecutiveErrors: available ? 0 : 1,
  });

  return {
    name,
    getQuote: () => resolve(outcome),
    getHistory: () => Promise.resolve(history),
    search: () => Promise.resolve([]),
    health,
  };
}
