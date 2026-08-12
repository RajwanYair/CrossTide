/** Browser-mode contract fixtures for canonical market-data envelopes. */
import { describe, expect, it } from "vitest";
import { createMarketDataEnvelope, type MarketDataEnvelope } from "../../src/types/market-data";

type Fixture = {
  readonly status: "cached" | "stale" | "demo" | "partial";
  readonly warnings: readonly string[];
};

const fixtures: readonly Fixture[] = [
  { status: "cached", warnings: [] },
  { status: "stale", warnings: ["Provider data is older than the requested freshness window"] },
  { status: "demo", warnings: ["Synthetic data is shown because no provider is configured"] },
  { status: "partial", warnings: ["One or more symbols failed upstream"] },
];

describe("market-data envelope browser fixtures", () => {
  it.each(fixtures)("round-trips the $status state", async (fixture) => {
    const envelope = createMarketDataEnvelope(
      "derived",
      { value: 42 },
      { source: "browser-fixture", fetchedAt: "2026-01-01T00:00:00.000Z" },
      fixture.status,
      fixture.warnings,
    );

    const response = Response.json(envelope);
    const roundTripped = (await response.json()) as MarketDataEnvelope<{ value: number }>;

    expect(roundTripped.schemaVersion).toBe("1");
    expect(roundTripped.kind).toBe("derived");
    expect(roundTripped.status).toBe(fixture.status);
    expect(roundTripped.data.value).toBe(42);
    expect(roundTripped.provenance.source).toBe("browser-fixture");
    expect(roundTripped.warnings).toEqual(fixture.warnings);
  });
});
