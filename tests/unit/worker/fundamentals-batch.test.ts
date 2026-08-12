import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleFundamentalsBatch } from "../../../worker/routes/fundamentals-batch";

vi.mock("../../../worker/providers/yahoo", () => ({
  fetchYahooFundamentals: vi.fn().mockImplementation((sym: string) =>
    Promise.resolve({
      symbol: sym,
      pe: 25,
      eps: 5.5,
      marketCap: 1_000_000_000,
    }),
  ),
}));

const mockKvStore = {
  get: vi.fn(),
  put: vi.fn(),
};

function makeEnv(): Parameters<typeof handleFundamentalsBatch>[1] {
  return { QUOTE_CACHE: mockKvStore } as Parameters<typeof handleFundamentalsBatch>[1];
}

function makeReq(body: unknown): Request {
  return new Request("https://example.com/api/fundamentals/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("handleFundamentalsBatch", () => {
  beforeEach(() => {
    mockKvStore.get.mockResolvedValue(null);
    mockKvStore.put.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns fundamentals for multiple symbols", async () => {
    const res = await handleFundamentalsBatch(makeReq({ symbols: ["AAPL", "MSFT"] }), makeEnv());
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      schemaVersion: string;
      kind: string;
      data: { results: Record<string, unknown>; errors: string[] };
    };
    expect(body.schemaVersion).toBe("1");
    expect(body.kind).toBe("fundamentals");
    expect(body.data.results.AAPL).toBeDefined();
    expect(body.data.results.MSFT).toBeDefined();
    expect(body.data.errors).toHaveLength(0);
  });

  it("rejects missing symbols array", async () => {
    const res = await handleFundamentalsBatch(makeReq({}), makeEnv());
    expect(res.status).toBe(400);
  });

  it("rejects empty symbols array", async () => {
    const res = await handleFundamentalsBatch(makeReq({ symbols: [] }), makeEnv());
    expect(res.status).toBe(400);
  });

  it("rejects invalid JSON body", async () => {
    const req = new Request("https://example.com/api/fundamentals/batch", {
      method: "POST",
      body: "not json",
    });
    const res = await handleFundamentalsBatch(req, makeEnv());
    expect(res.status).toBe(400);
  });

  it("returns cached data when available", async () => {
    const cached = { symbol: "AAPL", pe: 20, source: "yahoo" };
    mockKvStore.get.mockImplementation((key: string) =>
      key.includes("AAPL") ? Promise.resolve(JSON.stringify(cached)) : Promise.resolve(null),
    );
    const res = await handleFundamentalsBatch(makeReq({ symbols: ["AAPL"] }), makeEnv());
    const body = (await res.json()) as { data: { results: Record<string, { source: string }> } };
    expect(body.data.results.AAPL.source).toBe("cache");
  });

  it("filters out invalid symbols", async () => {
    const res = await handleFundamentalsBatch(makeReq({ symbols: ["AAPL", "!!!"] }), makeEnv());
    const body = (await res.json()) as { data: { results: Record<string, unknown> } };
    expect(body.data.results.AAPL).toBeDefined();
    expect(body.data.results["!!!"]).toBeUndefined();
  });

  it("limits batch to 20 symbols", async () => {
    const symbols = Array.from({ length: 30 }, (_, i) => `SYM${i}`);
    const res = await handleFundamentalsBatch(makeReq({ symbols }), makeEnv());
    const body = (await res.json()) as { data: { results: Record<string, unknown> } };
    expect(Object.keys(body.data.results).length).toBeLessThanOrEqual(20);
  });
});
