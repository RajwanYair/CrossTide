import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleSearch } from "../../../worker/routes/search";

type Env = Parameters<typeof handleSearch>[1];

function makeEnv(withKv = false): Env {
  if (withKv) {
    return {
      QUOTE_CACHE: { get: vi.fn(), put: vi.fn() },
    } as unknown as Env;
  }
  return {} as Env;
}

function makeUrl(query: string, limit?: number): URL {
  const url = new URL("https://test.local/api/search");
  url.searchParams.set("q", query);
  if (limit !== undefined) url.searchParams.set("limit", String(limit));
  return url;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("handleSearch", () => {
  it("returns 400 for empty query", () => {
    const res = handleSearch(makeUrl(""), makeEnv());
    expect(res.status).toBe(400);
  });

  it("returns 400 for query over 50 chars", () => {
    const res = handleSearch(makeUrl("a".repeat(51)), makeEnv());
    expect(res.status).toBe(400);
  });

  it("returns results for valid ticker query", async () => {
    const res = handleSearch(makeUrl("AAPL"), makeEnv());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { results: Array<{ ticker: string }>; total: number };
    expect(body.results.length).toBeGreaterThan(0);
    expect(body.results[0]!.ticker).toBe("AAPL");
  });

  it("returns results for name query", async () => {
    const res = handleSearch(makeUrl("apple"), makeEnv());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { results: Array<{ ticker: string }> };
    expect(body.results.some((r) => r.ticker === "AAPL")).toBe(true);
  });

  it("respects limit parameter", async () => {
    const res = handleSearch(makeUrl("a", 2), makeEnv());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { results: unknown[] };
    expect(body.results.length).toBeLessThanOrEqual(2);
  });

  it("caps limit at 50", async () => {
    const res = handleSearch(makeUrl("a", 100), makeEnv());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { results: unknown[] };
    expect(body.results.length).toBeLessThanOrEqual(50);
  });

  it("returns empty results for non-matching query", async () => {
    const res = handleSearch(makeUrl("zzznonexistent"), makeEnv());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { results: unknown[]; total: number };
    expect(body.results).toEqual([]);
    expect(body.total).toBe(0);
  });

  it("finds ETFs by ticker", async () => {
    const res = handleSearch(makeUrl("SPY"), makeEnv());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { results: Array<{ ticker: string; type: string }> };
    expect(body.results.some((r) => r.ticker === "SPY" && r.type === "ETF")).toBe(true);
  });

  it("uses yahoo search when KV is available and falls back on error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));
    const res = await handleSearch(makeUrl("AAPL"), makeEnv(true));
    expect(res.status).toBe(200);
    // Falls back to catalogue
    const body = (await res.json()) as { results: Array<{ ticker: string }> };
    expect(body.results.some((r) => r.ticker === "AAPL")).toBe(true);
  });
});
