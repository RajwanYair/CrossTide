/** Tests for canonical market-data metadata rendering. */
import { describe, expect, it } from "vitest";
import { renderDataMetadata } from "../../../src/cards/data-metadata";
import { createMarketDataEnvelope } from "../../../src/types/market-data";

describe("renderDataMetadata", () => {
  it("renders source, status, age, and optional provenance", () => {
    const envelope = createMarketDataEnvelope(
      "quote",
      { symbol: "AAPL" },
      {
        source: "yahoo",
        fetchedAt: "2026-08-12T12:00:00.000Z",
        asOf: "2026-08-12T11:59:30.000Z",
        timezone: "America/New_York",
        attribution: "Yahoo Finance",
        coverage: "Real-time quote snapshot",
        marketStatus: "REGULAR",
        adjustmentPolicy: "Provider-reported",
        limitations: ["Delayed for some instruments"],
      },
      "cached",
    );

    const html = renderDataMetadata(envelope, Date.parse("2026-08-12T12:03:00.000Z"));

    expect(html).toContain('class="data-metadata"');
    expect(html).toContain("cached");
    expect(html).toContain("Source: yahoo");
    expect(html).toContain("Updated 3m ago");
    expect(html).toContain("Market data as of: 2026-08-12T11:59:30.000Z");
    expect(html).toContain("Timezone: America/New_York");
    expect(html).toContain("Yahoo Finance");
    expect(html).toContain("Coverage: Real-time quote snapshot");
    expect(html).toContain("Market: REGULAR");
    expect(html).toContain("Adjustments: Provider-reported");
    expect(html).toContain("Delayed for some instruments");
  });

  it("marks partial data stale and escapes warning markup", () => {
    const envelope = createMarketDataEnvelope(
      "derived",
      { value: 1 },
      { source: "worker", fetchedAt: "invalid" },
      "partial",
      ["<provider> unavailable & delayed"],
    );

    const html = renderDataMetadata(envelope, Date.parse("2026-08-12T12:00:00.000Z"));

    expect(html).toContain("data-metadata--stale");
    expect(html).toContain("Updated unknown age ago");
    expect(html).toContain("&lt;provider&gt; unavailable &amp; delayed");
    expect(html).not.toContain("<provider> unavailable");
  });
});
