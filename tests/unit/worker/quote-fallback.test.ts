/**
 * Tests for quote route Finnhub fallback — when Yahoo fails and FINNHUB_KEY is set,
 * the route should try Finnhub as an alternative provider.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleQuote } from "../../../worker/routes/quote";

type Env = Parameters<typeof handleQuote>[1];

const mockKv = {
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

function makeEnv(overrides: Partial<Env> = {}): Env {
  return {
    QUOTE_CACHE: mockKv as unknown as Env["QUOTE_CACHE"],
    ...overrides,
  } as Env;
}

/** Finnhub /quote endpoint response shape. */
const finnhubQuoteResponse = {
  c: 150.0,
  d: 2.5,
  dp: 1.69,
  h: 152.0,
  l: 148.0,
  o: 149.0,
  pc: 147.5,
  t: 1700000000,
};

describe("handleQuote — Finnhub fallback", () => {
  let callCount: number;

  beforeEach(() => {
    callCount = 0;
    mockKv.get.mockResolvedValue(null);
    mockKv.put.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("falls back to Finnhub when Yahoo fails and key is present", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        callCount++;
        if (url.includes("yahoo")) {
          return new Response("Service Unavailable", { status: 503 });
        }
        if (url.includes("finnhub")) {
          return new Response(JSON.stringify(finnhubQuoteResponse), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response("Not Found", { status: 404 });
      }),
    );

    const res = await handleQuote("AAPL", makeEnv({ FINNHUB_KEY: "test-key" }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { source: string; price: number };
    expect(body.source).toBe("finnhub");
    expect(body.price).toBe(150.0);
    expect(callCount).toBeGreaterThanOrEqual(2);
  });

  it("returns 502 when both Yahoo and Finnhub fail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("Server Error", { status: 500 })),
    );

    const res = await handleQuote("AAPL", makeEnv({ FINNHUB_KEY: "test-key" }));
    expect(res.status).toBe(502);
  });

  it("returns 502 when Yahoo fails and no FINNHUB_KEY", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("Server Error", { status: 500 })),
    );

    const res = await handleQuote("AAPL", makeEnv());
    expect(res.status).toBe(502);
  });
});
