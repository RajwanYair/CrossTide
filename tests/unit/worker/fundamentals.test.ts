import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleFundamentals } from "../../../worker/routes/fundamentals";
import type { YahooFundamentals } from "../../../worker/providers/yahoo";

vi.mock("../../../worker/providers/yahoo.js", () => ({
  fetchYahooFundamentals: vi.fn(),
}));

import { fetchYahooFundamentals } from "../../../worker/providers/yahoo";

const mockKvStore = {
  get: vi.fn(),
  put: vi.fn(),
};

function makeEnv(withKv = true): Parameters<typeof handleFundamentals>[1] {
  return { QUOTE_CACHE: withKv ? mockKvStore : undefined } as Parameters<
    typeof handleFundamentals
  >[1];
}

const sampleFundamentals: YahooFundamentals = {
  symbol: "AAPL",
  shortName: "Apple Inc.",
  sector: "Technology",
  industry: "Consumer Electronics",
  marketCap: 3_000_000_000_000,
  enterpriseValue: 3_100_000_000_000,
  trailingPE: 28.5,
  forwardPE: 25.0,
  pegRatio: 1.8,
  priceToBook: 45.2,
  eps: 6.42,
  revenue: 385_000_000_000,
  revenueGrowth: 0.08,
  grossMargin: 0.44,
  operatingMargin: 0.3,
  profitMargin: 0.24,
  returnOnEquity: 1.47,
  debtToEquity: 150.0,
  dividendYield: 0.005,
  beta: 1.2,
};

describe("handleFundamentals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockKvStore.get.mockResolvedValue(null);
    mockKvStore.put.mockResolvedValue(undefined);
    (fetchYahooFundamentals as ReturnType<typeof vi.fn>).mockResolvedValue(sampleFundamentals);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns cache hit when KV has data", async () => {
    mockKvStore.get.mockResolvedValue(JSON.stringify(sampleFundamentals));

    const res = await handleFundamentals("AAPL", makeEnv());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect((body as { source: string }).source).toBe("cache");
    expect(fetchYahooFundamentals).not.toHaveBeenCalled();
  });

  it("fetches from Yahoo on cache miss and stores result", async () => {
    const res = await handleFundamentals("AAPL", makeEnv());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect((body as { source: string }).source).toBe("yahoo");
    expect((body as { symbol: string }).symbol).toBe("AAPL");
    expect(mockKvStore.put).toHaveBeenCalledOnce();
    expect(fetchYahooFundamentals).toHaveBeenCalledWith("AAPL");
  });

  it("normalizes symbol to uppercase in cache key", async () => {
    await handleFundamentals("aapl", makeEnv());
    expect(mockKvStore.get).toHaveBeenCalledWith("fundamentals:AAPL", expect.anything());
  });

  it("returns Yahoo data without caching when no KV binding", async () => {
    const res = await handleFundamentals("MSFT", makeEnv(false));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect((body as { source: string }).source).toBe("yahoo");
    expect(mockKvStore.put).not.toHaveBeenCalled();
  });

  it("returns 502 when Yahoo fetch fails", async () => {
    (fetchYahooFundamentals as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("upstream error"),
    );
    const res = await handleFundamentals("AAPL", makeEnv());
    expect(res.status).toBe(502);
    const body = await res.json();
    expect((body as { error: string }).error).toMatch(/failed/i);
  });

  it("includes expected fundamental fields in response", async () => {
    const res = await handleFundamentals("AAPL", makeEnv(false));
    const body = await res.json();
    const data = body as YahooFundamentals & { source: string };
    expect(typeof data.trailingPE).toBe("number");
    expect(typeof data.eps).toBe("number");
    expect(typeof data.marketCap).toBe("number");
    expect(typeof data.grossMargin).toBe("number");
  });
});
