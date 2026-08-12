/** Canonical versioned envelope for market data and derived outputs. */

/** Supported market-data and derived-output dataset kinds. */
export type MarketDataKind = "quote" | "chart" | "fundamentals" | "news" | "derived";

/** Delivery state of a market-data payload. */
export type MarketDataStatus = "live" | "cached" | "stale" | "partial" | "demo";

/** Provenance and timing metadata attached to every canonical payload. */
export interface MarketDataProvenance {
  readonly source: string;
  readonly fetchedAt: string;
  readonly asOf?: string;
  readonly timezone?: string;
  readonly attribution?: string;
  readonly coverage?: string;
  readonly marketStatus?: string;
  readonly adjustmentPolicy?: string;
  readonly limitations?: readonly string[];
}

/** Versioned response shared by application, Worker, and package consumers. */
export interface MarketDataEnvelope<T> {
  readonly schemaVersion: "1";
  readonly kind: MarketDataKind;
  readonly status: MarketDataStatus;
  readonly data: T;
  readonly provenance: MarketDataProvenance;
  readonly warnings: readonly string[];
}

/** Construct a canonical market-data response without changing the payload. */
export function createMarketDataEnvelope<T>(
  kind: MarketDataKind,
  data: T,
  provenance: MarketDataProvenance,
  status: MarketDataStatus = "live",
  warnings: readonly string[] = [],
): MarketDataEnvelope<T> {
  return { schemaVersion: "1", kind, status, data, provenance, warnings };
}
