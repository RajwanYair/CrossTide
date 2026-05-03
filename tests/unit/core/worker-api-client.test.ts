import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createApiClient,
  getApiClient,
  _resetApiClientForTests,
} from "../../../src/core/worker-api-client";

// ---------------------------------------------------------------------------
// Mock fetch factory helpers
// ---------------------------------------------------------------------------

function mockFetch(status: number, body: unknown): typeof fetch {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(String(body)),
  }) as unknown as typeof fetch;
}

function failFetch(message = "network error"): typeof fetch {
  return vi.fn().mockRejectedValue(new Error(message)) as unknown as typeof fetch;
}

const BASE = "https://worker.example.com";

// ---------------------------------------------------------------------------
// health
// ---------------------------------------------------------------------------

describe("WorkerApiClient", () => {
  describe("health", () => {
    it("returns ok:true with HealthResponse on 200", async () => {
      const payload = { status: "ok", version: "1.0.0", timestamp: "2026-05-01T00:00:00Z" };
      const client = createApiClient(BASE, { fetchFn: mockFetch(200, payload) });
      const result = await client.health();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.status).toBe("ok");
        expect(result.value.version).toBe("1.0.0");
      }
    });

    it("returns ok:false on non-2xx status", async () => {
      const client = createApiClient(BASE, { fetchFn: mockFetch(503, "Service Unavailable") });
      const result = await client.health();
      expect(result.ok).toBe(false);
    });

    it("returns ok:false on network error", async () => {
      const client = createApiClient(BASE, { fetchFn: failFetch("timeout") });
      const result = await client.health();
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain("timeout");
      }
    });
  });

  // ---------------------------------------------------------------------------
  // chart
  // ---------------------------------------------------------------------------

  describe("chart", () => {
    it("returns ChartResponse on 200", async () => {
      const payload = { ticker: "AAPL", currency: "USD", candles: [] };
      const fetchFn = mockFetch(200, payload);
      const client = createApiClient(BASE, { fetchFn });
      const result = await client.chart({ ticker: "AAPL", range: "1y", interval: "1d" });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.ticker).toBe("AAPL");
      }
    });

    it("includes query params in the URL", async () => {
      const fetchFn = mockFetch(200, { ticker: "MSFT", currency: "USD", candles: [] });
      const client = createApiClient(BASE, { fetchFn });
      await client.chart({ ticker: "MSFT", range: "6mo", interval: "1d" });
      const calledUrl = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(calledUrl).toContain("ticker=MSFT");
      expect(calledUrl).toContain("range=6mo");
      expect(calledUrl).toContain("interval=1d");
    });

    it("returns ok:false on 404", async () => {
      const client = createApiClient(BASE, { fetchFn: mockFetch(404, "Not Found") });
      const result = await client.chart({ ticker: "ZZZZZ" });
      expect(result.ok).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // search
  // ---------------------------------------------------------------------------

  describe("search", () => {
    it("returns SearchResponse on 200", async () => {
      const payload = {
        results: [{ ticker: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", type: "equity" }],
      };
      const client = createApiClient(BASE, { fetchFn: mockFetch(200, payload) });
      const result = await client.search({ q: "apple", limit: 5 });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.results).toHaveLength(1);
        expect(result.value.results[0]?.ticker).toBe("AAPL");
      }
    });

    it("includes limit in query string", async () => {
      const fetchFn = mockFetch(200, { results: [] });
      const client = createApiClient(BASE, { fetchFn });
      await client.search({ q: "tesla", limit: 10 });
      const url = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(url).toContain("q=tesla");
      expect(url).toContain("limit=10");
    });
  });

  // ---------------------------------------------------------------------------
  // screener
  // ---------------------------------------------------------------------------

  describe("screener", () => {
    it("sends POST with JSON body and returns ScreenerResponse", async () => {
      const payload = { rows: [{ ticker: "AAPL", consensus: "BUY", rsi: 45, adx: 30 }] };
      const fetchFn = mockFetch(200, payload);
      const client = createApiClient(BASE, { fetchFn });
      const result = await client.screener({
        tickers: ["AAPL"],
        consensus: "BUY",
        minAdx: 25,
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.rows).toHaveLength(1);
      }

      // Verify POST method + Content-Type
      const [, init] = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(init.method).toBe("POST");
      expect((init.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
    });

    it("returns ok:false on screener network failure", async () => {
      const client = createApiClient(BASE, { fetchFn: failFetch("fetch failed") });
      const result = await client.screener({ tickers: ["X"] });
      expect(result.ok).toBe(false);
    });
  });

  describe("signalDslExecute", () => {
    it("sends POST with expression/vars and returns result", async () => {
      const payload = { result: true };
      const fetchFn = mockFetch(200, payload);
      const client = createApiClient(BASE, { fetchFn });
      const result = await client.signalDslExecute({
        expression: "rsi < 30 and price > 50",
        vars: { rsi: 25, price: 100 },
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.result).toBe(true);
      }

      const [, init] = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      expect(init.method).toBe("POST");
      expect((init.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
      expect(String(init.body)).toContain("rsi < 30");
    });

    it("returns ok:false on endpoint failure", async () => {
      const client = createApiClient(BASE, {
        fetchFn: mockFetch(400, { error: "bad expression" }),
      });
      const result = await client.signalDslExecute({ expression: "(" });
      expect(result.ok).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Singleton
  // ---------------------------------------------------------------------------

  describe("singleton", () => {
    beforeEach(() => {
      _resetApiClientForTests();
    });

    it("getApiClient returns the same instance on subsequent calls", () => {
      const a = getApiClient();
      const b = getApiClient();
      expect(a).toBe(b);
    });

    it("_resetApiClientForTests forces a new instance", () => {
      const a = getApiClient();
      _resetApiClientForTests();
      const b = getApiClient();
      expect(a).not.toBe(b);
    });
  });
});
