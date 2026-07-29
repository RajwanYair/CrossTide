import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleChart } from "../../../worker/routes/chart";

const mockKvStore = {
  get: vi.fn(),
  put: vi.fn(),
};

function makeEnv(withKv = true): Parameters<typeof handleChart>[1] {
  return { QUOTE_CACHE: withKv ? mockKvStore : undefined } as Parameters<typeof handleChart>[1];
}

function makeEnvWith(
  overrides: Partial<Parameters<typeof handleChart>[1]>,
): Parameters<typeof handleChart>[1] {
  return { QUOTE_CACHE: mockKvStore, ...overrides } as Parameters<typeof handleChart>[1];
}

function makeUrl(params: Record<string, string>): URL {
  const u = new URL("https://worker.example.com/api/chart");
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  return u;
}

/** Yahoo Finance raw response format (matches YahooChartResponse interface). */
const yahooApiResponse = {
  chart: {
    result: [
      {
        meta: { symbol: "AAPL", currency: "USD" },
        timestamp: [1704153600, 1704240000],
        indicators: {
          quote: [
            {
              open: [100, 103],
              high: [105, 107],
              low: [98, 101],
              close: [103, 106],
              volume: [1_000_000, 900_000],
            },
          ],
        },
      },
    ],
  },
};

describe("handleChart", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(yahooApiResponse),
      }),
    );
    mockKvStore.get.mockResolvedValue(null);
    mockKvStore.put.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 400 when ticker is missing", async () => {
    const res = await handleChart(makeUrl({}), makeEnv());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  it("returns 400 for invalid ticker characters", async () => {
    const res = await handleChart(makeUrl({ ticker: "AA PL!" }), makeEnv());
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid range", async () => {
    const res = await handleChart(makeUrl({ ticker: "AAPL", range: "10y" }), makeEnv());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect((body as { error: string }).error).toMatch(/range/i);
  });

  it("returns 400 for invalid interval", async () => {
    const res = await handleChart(makeUrl({ ticker: "AAPL", interval: "3h" }), makeEnv());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect((body as { error: string }).error).toMatch(/interval/i);
  });

  it("returns cached data without fetching upstream", async () => {
    const cached = { ticker: "AAPL", currency: "USD", candles: [], source: "yahoo" };
    mockKvStore.get.mockResolvedValue(JSON.stringify(cached));

    const res = await handleChart(makeUrl({ ticker: "AAPL" }), makeEnv());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect((body as { source: string }).source).toBe("cache");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("fetches from Yahoo on cache miss and caches result", async () => {
    const res = await handleChart(makeUrl({ ticker: "AAPL" }), makeEnv());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect((body as { source: string }).source).toBe("yahoo");
    expect((body as { ticker: string }).ticker).toBe("AAPL");
    expect(mockKvStore.put).toHaveBeenCalledOnce();
  });

  it("returns demo data when no KV binding (preview/dev)", async () => {
    const res = await handleChart(makeUrl({ ticker: "MSFT", range: "1y" }), makeEnv(false));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect((body as { source: string }).source).toBe("demo");
    expect((body as { ticker: string }).ticker).toBe("MSFT");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns demo fallback with warning header when Yahoo fails", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("upstream timeout"));
    const res = await handleChart(makeUrl({ ticker: "AAPL" }), makeEnv());
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Data-Source")).toBe("demo-fallback");
    const body = await res.json();
    expect((body as { source: string }).source).toBe("demo");
  });

  it("falls back to Massive for daily history", async () => {
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

    const res = await handleChart(
      makeUrl({ ticker: "AAPL", range: "1mo", interval: "1d" }),
      makeEnvWith({ MASSIVE_KEY: "test-key" }),
    );
    const body = (await res.json()) as { source: string; candles: unknown[] };
    expect(body.source).toBe("massive");
    expect(body.candles).toHaveLength(1);
    expect(res.headers.get("X-Data-Source")).toBe("massive-fallback");
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

    const res = await handleChart(
      makeUrl({ ticker: "AAPL", range: "1mo", interval: "1d" }),
      makeEnvWith({ MASSIVE_KEY: "test-key" }),
    );
    const body = (await res.json()) as { source: string };
    expect(res.status).toBe(200);
    expect(body.source).toBe("massive");
  });

  it("falls back to Alpha Vantage for daily history", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("alphavantage")) {
          return Response.json({
            "Time Series (Daily)": {
              "2024-01-02": {
                "1. open": "100",
                "2. high": "105",
                "3. low": "99",
                "4. close": "104",
                "5. volume": "1000",
              },
            },
          });
        }
        return new Response("Unavailable", { status: 503 });
      }),
    );

    const res = await handleChart(
      makeUrl({ ticker: "AAPL", range: "1mo", interval: "1d" }),
      makeEnvWith({ ALPHA_VANTAGE_KEY: "test-key" }),
    );
    const body = (await res.json()) as { source: string; candles: unknown[] };
    expect(body.source).toBe("alpha-vantage");
    expect(body.candles).toHaveLength(1);
    expect(res.headers.get("X-Data-Source")).toBe("alpha-vantage-fallback");
  });

  it("returns 200 with candles for valid 5d range", async () => {
    const res = await handleChart(makeUrl({ ticker: "TSLA", range: "5d" }), makeEnv());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray((body as { candles: unknown[] }).candles)).toBe(true);
  });

  it("normalizes ticker to uppercase", async () => {
    const res = await handleChart(makeUrl({ ticker: "aapl" }), makeEnv(false));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect((body as { ticker: string }).ticker).toBe("AAPL");
  });
});
