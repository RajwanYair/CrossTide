/**
 * Tests for the enhanced health endpoint — provider availability and binding status.
 */
import { describe, it, expect } from "vitest";
import { handleHealth } from "../../../worker/routes/health";

type Env = Parameters<typeof handleHealth>[0];

describe("handleHealth — providers", () => {
  it("reports all keyless providers as available", async () => {
    const env = { API_VERSION: "1" } as Env;
    const res = handleHealth(env);
    const body = (await res.json()) as {
      providers: Array<{ name: string; available: boolean }>;
    };
    const names = body.providers.filter((p) => p.available).map((p) => p.name);
    expect(names).toContain("yahoo");
    expect(names).toContain("coingecko");
    expect(names).toContain("stooq");
    expect(names).toContain("fred-csv");
  });

  it("reports finnhub as unavailable when no key", async () => {
    const env = { API_VERSION: "1" } as Env;
    const res = handleHealth(env);
    const body = (await res.json()) as {
      providers: Array<{ name: string; available: boolean }>;
    };
    const fh = body.providers.find((p) => p.name === "finnhub");
    expect(fh?.available).toBe(false);
  });

  it("reports finnhub as available when key is set", async () => {
    const env = { API_VERSION: "1", FINNHUB_KEY: "test-key" } as Env;
    const res = handleHealth(env);
    const body = (await res.json()) as {
      providers: Array<{ name: string; available: boolean }>;
    };
    const fh = body.providers.find((p) => p.name === "finnhub");
    expect(fh?.available).toBe(true);
  });

  it("reports fred-api as available when FRED_KEY is set", async () => {
    const env = { API_VERSION: "1", FRED_KEY: "my-key" } as Env;
    const res = handleHealth(env);
    const body = (await res.json()) as {
      providers: Array<{ name: string; available: boolean }>;
    };
    const fred = body.providers.find((p) => p.name === "fred-api");
    expect(fred?.available).toBe(true);
  });
});

describe("handleHealth — bindings", () => {
  it("reports all bindings as absent by default", async () => {
    const env = { API_VERSION: "1" } as Env;
    const res = handleHealth(env);
    const body = (await res.json()) as {
      bindings: { kvCache: boolean; d1: boolean; rateLimiter: boolean; tickerFanout: boolean };
    };
    expect(body.bindings.kvCache).toBe(false);
    expect(body.bindings.d1).toBe(false);
    expect(body.bindings.rateLimiter).toBe(false);
    expect(body.bindings.tickerFanout).toBe(false);
  });

  it("reports kvCache as present when QUOTE_CACHE is bound", async () => {
    const env = {
      API_VERSION: "1",
      QUOTE_CACHE: { get: () => null, put: () => undefined, delete: () => undefined },
    } as unknown as Env;
    const res = handleHealth(env);
    const body = (await res.json()) as { bindings: { kvCache: boolean } };
    expect(body.bindings.kvCache).toBe(true);
  });
});
