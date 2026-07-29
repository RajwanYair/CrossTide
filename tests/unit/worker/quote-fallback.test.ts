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

  it("falls back to Massive when Yahoo fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("yahoo")) return new Response("Unavailable", { status: 503 });
        if (url.includes("massive")) {
          return Response.json({
            status: "OK",
            results: [{ o: 100, h: 105, l: 99, c: 104, v: 1_000, t: 1_704_153_600_000 }],
          });
        }
        return new Response("Not Found", { status: 404 });
      }),
    );

    const res = await handleQuote("AAPL", makeEnv({ MASSIVE_KEY: "test-key" }));
    const body = (await res.json()) as { source: string; price: number };
    expect(res.status).toBe(200);
    expect(body).toMatchObject({ source: "massive", price: 104 });
  });

  it("continues to Massive when Yahoo does not know the ticker", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("yahoo")) return new Response("Not Found", { status: 404 });
        if (url.includes("massive")) {
          return Response.json({
            status: "OK",
            results: [{ o: 100, h: 105, l: 99, c: 104, v: 1_000, t: 1_704_153_600_000 }],
          });
        }
        return new Response("Unavailable", { status: 503 });
      }),
    );

    const res = await handleQuote("AAPL", makeEnv({ MASSIVE_KEY: "test-key" }));
    const body = (await res.json()) as { source: string };
    expect(res.status).toBe(200);
    expect(body.source).toBe("massive");
  });

  it("falls back to Alpha Vantage when earlier providers fail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("alphavantage")) {
          return Response.json({
            "Global Quote": {
              "01. symbol": "AAPL",
              "02. open": "100",
              "03. high": "105",
              "04. low": "99",
              "05. price": "104",
              "06. volume": "1000",
              "08. previous close": "102",
            },
          });
        }
        return new Response("Unavailable", { status: 503 });
      }),
    );

    const res = await handleQuote("AAPL", makeEnv({ ALPHA_VANTAGE_KEY: "test-key" }));
    const body = (await res.json()) as { source: string; price: number };
    expect(res.status).toBe(200);
    expect(body).toMatchObject({ source: "alpha-vantage", price: 104 });
  });
});
