import { describe, expect, it } from "vitest";
import { createMarketDataEnvelope } from "../../../src/domain/index.js";
import {
  buildMarketDataFixture,
  MARKET_DATA_STATUS_FIXTURES,
} from "../../helpers/market-data-fixtures.js";
import { createMarketDataEnvelope as createCoreEnvelope } from "../../../src/core/index.js";
import { createMarketDataEnvelope as createWorkerEnvelope } from "../../../worker/index.js";
import { createMarketDataEnvelope as createMcpEnvelope } from "../../../mcp-server/src/contracts.js";

describe("createMarketDataEnvelope", () => {
  it("is re-exported by core, Worker, and MCP contract barrels", () => {
    const provenance = { source: "test", fetchedAt: "2026-08-12T12:00:00.000Z" };
    const expected = createMarketDataEnvelope("derived", { value: 1 }, provenance);

    expect(createCoreEnvelope("derived", { value: 1 }, provenance)).toEqual(expected);
    expect(createWorkerEnvelope("derived", { value: 1 }, provenance)).toEqual(expected);
    expect(createMcpEnvelope("derived", { value: 1 }, provenance)).toEqual(expected);
  });

  it("creates a versioned live payload with provenance", () => {
    const envelope = createMarketDataEnvelope(
      "quote",
      { symbol: "AAPL", price: 180 },
      { source: "yahoo", fetchedAt: "2026-08-12T12:00:00.000Z", asOf: "2026-08-12T11:59:00.000Z" },
    );

    expect(envelope).toEqual({
      schemaVersion: "1",
      kind: "quote",
      status: "live",
      data: { symbol: "AAPL", price: 180 },
      provenance: {
        source: "yahoo",
        fetchedAt: "2026-08-12T12:00:00.000Z",
        asOf: "2026-08-12T11:59:00.000Z",
      },
      warnings: [],
    });
  });

  it("preserves cached status and warnings", () => {
    const envelope = createMarketDataEnvelope(
      "chart",
      [],
      { source: "cache", fetchedAt: "2026-08-12T12:00:00.000Z" },
      "cached",
      ["Provider response was cached"],
    );

    expect(envelope.status).toBe("cached");
    expect(envelope.warnings).toEqual(["Provider response was cached"]);
  });

  it.each(MARKET_DATA_STATUS_FIXTURES)("supports the $name contract state", (fixture) => {
    const expected = buildMarketDataFixture(fixture);
    const actual = createMarketDataEnvelope(
      fixture.kind,
      fixture.data,
      expected.provenance,
      fixture.status,
      fixture.warnings,
    );

    expect(actual).toEqual(expected);
  });
});
