import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleSeasonality } from "../../../worker/routes/seasonality";

type KvStore = { get: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn> };

function makeEnv(kv?: KvStore): Parameters<typeof handleSeasonality>[1] {
  return { QUOTE_CACHE: kv } as Parameters<typeof handleSeasonality>[1];
}

function makeYahooResponse(days: number): object {
  const now = Math.floor(Date.now() / 1000);
  const timestamps: number[] = [];
  const opens: number[] = [];
  const highs: number[] = [];
  const lows: number[] = [];
  const closes: number[] = [];
  const volumes: number[] = [];

  for (let i = 0; i < days; i++) {
    const t = now - (days - i) * 86400;
    timestamps.push(t);
    const base = 100 + Math.sin(i * 0.1) * 10;
    opens.push(Number(base.toFixed(2)));
    highs.push(Number((base + 2).toFixed(2)));
    lows.push(Number((base - 2).toFixed(2)));
    closes.push(Number((base + 1).toFixed(2)));
    volumes.push(1_000_000);
  }

  return {
    chart: {
      result: [
        {
          meta: { currency: "USD", symbol: "AAPL" },
          timestamp: timestamps,
          indicators: {
            quote: [{ open: opens, high: highs, low: lows, close: closes, volume: volumes }],
          },
        },
      ],
    },
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("handleSeasonality", () => {
  it("returns 400 for invalid symbol", async () => {
    const res = await handleSeasonality("!!BAD!!", makeEnv());
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("Invalid symbol");
  });

  it("returns seasonality data for a valid symbol", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify(makeYahooResponse(500)))),
    );

    const res = await handleSeasonality("AAPL", makeEnv());
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      symbol: string;
      byMonth: Array<{
        key: number;
        label: string;
        count: number;
        meanReturn: number;
        winRate: number;
      }>;
      byDayOfWeek: Array<{ key: number; label: string }>;
      totalDays: number;
      source: string;
    };
    expect(body.symbol).toBe("AAPL");
    expect(body.byMonth.length).toBeGreaterThan(0);
    expect(body.byDayOfWeek.length).toBeGreaterThan(0);
    expect(body.totalDays).toBe(499);
    expect(body.source).toBe("yahoo");
  });

  it("returns cached response when available", async () => {
    const cached = {
      symbol: "MSFT",
      byMonth: [],
      byDayOfWeek: [],
      totalDays: 100,
      source: "yahoo",
    };
    const kv: KvStore = {
      get: vi.fn().mockResolvedValue(JSON.stringify(cached)),
      put: vi.fn().mockResolvedValue(undefined),
    };

    const res = await handleSeasonality("MSFT", makeEnv(kv));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { source: string };
    expect(body.source).toBe("cache");
    expect(kv.get).toHaveBeenCalledWith("seasonality:MSFT", "text");
  });

  it("caches result after fetching", async () => {
    const kv: KvStore = {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify(makeYahooResponse(100)))),
    );

    await handleSeasonality("GOOG", makeEnv(kv));
    expect(kv.put).toHaveBeenCalled();
  });

  it("returns 404 when insufficient data", async () => {
    const emptyResponse = {
      chart: {
        result: [
          {
            meta: { currency: "USD", symbol: "X" },
            timestamp: [1700000000],
            indicators: {
              quote: [{ open: [100], high: [102], low: [98], close: [101], volume: [50000] }],
            },
          },
        ],
      },
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(emptyResponse))));

    const res = await handleSeasonality("X", makeEnv());
    expect(res.status).toBe(404);
  });

  it("returns 502 on fetch failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const res = await handleSeasonality("AAPL", makeEnv());
    expect(res.status).toBe(502);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("network down");
  });

  it("normalizes symbol to uppercase", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify(makeYahooResponse(100)))),
    );

    const res = await handleSeasonality("aapl", makeEnv());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { symbol: string };
    expect(body.symbol).toBe("AAPL");
  });
});
