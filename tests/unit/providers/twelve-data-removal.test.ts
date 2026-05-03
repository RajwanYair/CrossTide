/**
 * Validate R23 — Twelve Data provider removal and chain cleanup.
 */
import { describe, it, expect } from "vitest";
import * as providers from "../../../src/providers/index";

describe("R23 — Twelve Data removal", () => {
  it("createTwelveDataProvider is no longer exported", () => {
    expect("createTwelveDataProvider" in providers).toBe(false);
  });

  it("all remaining providers are still exported", () => {
    expect(typeof providers.createYahooProvider).toBe("function");
    expect(typeof providers.createPolygonProvider).toBe("function");
    expect(typeof providers.createCoinGeckoProvider).toBe("function");
    expect(typeof providers.createFinnhubProvider).toBe("function");
    expect(typeof providers.createStooqProvider).toBe("function");
    expect(typeof providers.createTiingoProvider).toBe("function");
  });

  it("provider chain factory is still exported", () => {
    expect(typeof providers.createProviderChain).toBe("function");
  });

  it("registry helpers are still exported", () => {
    expect(typeof providers.getChain).toBe("function");
    expect(typeof providers.getHealthSnapshot).toBe("function");
    expect(typeof providers.configureFinnhub).toBe("function");
    expect(typeof providers.configureTiingo).toBe("function");
  });

  it("circuit breaker is still exported", () => {
    expect(typeof providers.CircuitBreaker).toBe("function");
    expect(typeof providers.CircuitOpenError).toBe("function");
  });

  it("health stats are still exported", () => {
    expect(typeof providers.aggregateStats).toBe("function");
    expect(typeof providers.aggregateAll).toBe("function");
    expect(typeof providers.pruneOld).toBe("function");
  });
});
