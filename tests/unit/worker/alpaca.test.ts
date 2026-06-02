import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleAlpacaQuote, handleAlpacaBars } from "../../../worker/routes/alpaca";

type KvStore = { get: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn> };

function makeEnv(
  kv?: KvStore,
  overrides?: Partial<{ ALPACA_KEY: string | undefined; ALPACA_SECRET: string | undefined }>,
) {
  return {
    QUOTE_CACHE: kv,
    ALPACA_KEY: "test-key",
    ALPACA_SECRET: "test-secret",
    ...overrides,
  } as Parameters<typeof handleAlpacaQuote>[1];
}

const snapshotResponse = {
  latestTrade: { p: 175.5, s: 100, t: "2024-01-15T14:30:00Z" },
  dailyBar: { o: 174.0, h: 176.0, l: 173.5, c: 175.5, v: 50000000, t: "2024-01-15T00:00:00Z" },
  prevDailyBar: { o: 172.0, h: 173.5, l: 171.0, c: 173.0, v: 45000000, t: "2024-01-14T00:00:00Z" },
};

const barsResponse = {
  bars: [
    {
      t: "2024-01-10T00:00:00Z",
      o: 170.0,
      h: 172.0,
      l: 169.0,
      c: 171.5,
      v: 40000000,
      n: 500,
      vw: 170.5,
    },
    {
      t: "2024-01-11T00:00:00Z",
      o: 171.5,
      h: 174.0,
      l: 171.0,
      c: 173.0,
      v: 42000000,
      n: 510,
      vw: 172.5,
    },
  ],
  next_page_token: null,
  symbol: "AAPL",
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("handleAlpacaQuote", () => {
  it("returns 400 for empty symbol", async () => {
    const res = await handleAlpacaQuote("", makeEnv());
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("Invalid");
  });

  it("returns 400 for invalid symbol characters", async () => {
    const res = await handleAlpacaQuote("!!BAD!!", makeEnv());
    expect(res.status).toBe(400);
  });

  it("returns 503 when API keys are not configured", async () => {
    const res = await handleAlpacaQuote(
      "AAPL",
      makeEnv(undefined, { ALPACA_KEY: undefined, ALPACA_SECRET: undefined }),
    );
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("credentials");
  });

  it("returns cached quote when available", async () => {
    const kv: KvStore = {
      get: vi.fn().mockResolvedValue(JSON.stringify({ ticker: "AAPL", price: 175.5 })),
      put: vi.fn(),
    };
    const res = await handleAlpacaQuote("AAPL", makeEnv(kv));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ticker: string; source: string };
    expect(body.source).toBe("cache");
    expect(kv.get).toHaveBeenCalled();
  });

  it("fetches from Alpaca on cache miss", async () => {
    const kv: KvStore = {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn(),
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify(snapshotResponse), { status: 200 })),
    );

    const res = await handleAlpacaQuote("AAPL", makeEnv(kv));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ticker: string; price: number; source: string };
    expect(body.ticker).toBe("AAPL");
    expect(body.price).toBe(175.5);
    expect(body.source).toBe("alpaca");
    expect(kv.put).toHaveBeenCalled();
  });

  it("returns 502 on upstream error", async () => {
    const kv: KvStore = {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn(),
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("Internal Server Error", { status: 500 })),
    );

    const res = await handleAlpacaQuote("AAPL", makeEnv(kv));
    expect(res.status).toBe(502);
  });

  it("returns 404 when Alpaca returns 422 (unknown symbol)", async () => {
    const kv: KvStore = {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn(),
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("not found", { status: 422 })));

    const res = await handleAlpacaQuote("XXXXX", makeEnv(kv));
    expect(res.status).toBe(404);
  });
});

describe("handleAlpacaBars", () => {
  it("returns 400 for invalid symbol", async () => {
    const url = new URL("http://localhost/api/alpaca/bars/!!BAD");
    const res = await handleAlpacaBars("!!BAD", url, makeEnv());
    expect(res.status).toBe(400);
  });

  it("returns 503 when API keys are not configured", async () => {
    const url = new URL("http://localhost/api/alpaca/bars/AAPL");
    const res = await handleAlpacaBars(
      "AAPL",
      url,
      makeEnv(undefined, { ALPACA_KEY: undefined, ALPACA_SECRET: undefined }),
    );
    expect(res.status).toBe(503);
  });

  it("returns bars data from Alpaca", async () => {
    const kv: KvStore = {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn(),
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify(barsResponse), { status: 200 })),
    );

    const url = new URL("http://localhost/api/alpaca/bars/AAPL?days=30");
    const res = await handleAlpacaBars("AAPL", url, makeEnv(kv));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ticker: string; candles: unknown[] };
    expect(body.ticker).toBe("AAPL");
    expect(body.candles).toHaveLength(2);
  });

  it("clamps days to max 5000", async () => {
    const kv: KvStore = {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn(),
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify(barsResponse), { status: 200 })),
    );

    const url = new URL("http://localhost/api/alpaca/bars/AAPL?days=99999");
    const res = await handleAlpacaBars("AAPL", url, makeEnv(kv));
    expect(res.status).toBe(200);
  });
});
