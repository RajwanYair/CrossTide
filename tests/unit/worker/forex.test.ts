import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleForex } from "../../../worker/routes/forex";

const mockKvStore = {
  get: vi.fn(),
  put: vi.fn(),
};

function makeEnv(): Parameters<typeof handleForex>[1] {
  return { QUOTE_CACHE: mockKvStore } as Parameters<typeof handleForex>[1];
}

const validResponse = {
  chart: {
    result: [
      {
        meta: {
          regularMarketPrice: 1.0856,
          previousClose: 1.0834,
          bid: 1.0855,
          ask: 1.0857,
          regularMarketDayHigh: 1.0878,
          regularMarketDayLow: 1.0821,
          regularMarketTime: 1714924800,
        },
      },
    ],
  },
};

describe("handleForex", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(validResponse),
      }),
    );
    mockKvStore.get.mockResolvedValue(null);
    mockKvStore.put.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns forex quote for valid pair", async () => {
    const res = await handleForex("EURUSD", makeEnv());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { pair: string; rate: number; from: string; to: string };
    expect(body.pair).toBe("EURUSD");
    expect(body.from).toBe("EUR");
    expect(body.to).toBe("USD");
    expect(body.rate).toBe(1.0856);
  });

  it("rejects invalid pair format", async () => {
    const res = await handleForex("EUR", makeEnv());
    expect(res.status).toBe(400);
  });

  it("rejects non-alpha pair", async () => {
    const res = await handleForex("EUR123", makeEnv());
    expect(res.status).toBe(400);
  });

  it("returns cached data when available", async () => {
    const cached = { pair: "EURUSD", rate: 1.0856, source: "yahoo" };
    mockKvStore.get.mockResolvedValue(JSON.stringify(cached));
    const res = await handleForex("EURUSD", makeEnv());
    const body = (await res.json()) as { source: string };
    expect(body.source).toBe("cache");
  });

  it("returns 502 on upstream error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    const res = await handleForex("EURUSD", makeEnv());
    expect(res.status).toBe(502);
  });

  it("caches result in KV", async () => {
    await handleForex("EURUSD", makeEnv());
    expect(mockKvStore.put).toHaveBeenCalled();
  });

  it("handles exception gracefully", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    const res = await handleForex("EURUSD", makeEnv());
    expect(res.status).toBe(502);
  });

  it("converts pair to uppercase", async () => {
    const res = await handleForex("eurusd", makeEnv());
    const body = (await res.json()) as { pair: string };
    expect(body.pair).toBe("EURUSD");
  });
});
