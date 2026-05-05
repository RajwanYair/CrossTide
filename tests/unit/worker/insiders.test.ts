import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleInsiders } from "../../../worker/routes/insiders";

const mockKvStore = {
  get: vi.fn(),
  put: vi.fn(),
};

function makeEnv(): Parameters<typeof handleInsiders>[1] {
  return { QUOTE_CACHE: mockKvStore } as Parameters<typeof handleInsiders>[1];
}

const yahooResponse = {
  quoteSummary: {
    result: [
      {
        insiderTransactions: {
          transactions: [
            {
              filerName: { raw: "Tim Cook" },
              filerRelation: { raw: "Chief Executive Officer" },
              transactionText: "Sale",
              startDate: { fmt: "2024-03-15" },
              shares: { raw: 50000 },
              value: { raw: 8500000 },
            },
            {
              filerName: { raw: "Art Levinson" },
              filerRelation: { raw: "Director" },
              transactionText: "Purchase",
              startDate: { fmt: "2024-04-01" },
              shares: { raw: 10000 },
              value: { raw: 1680000 },
            },
          ],
        },
      },
    ],
  },
};

describe("handleInsiders", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(yahooResponse),
      }),
    );
    mockKvStore.get.mockResolvedValue(null);
    mockKvStore.put.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 400 for invalid symbol", async () => {
    const res = await handleInsiders("!!!!", makeEnv());
    expect(res.status).toBe(400);
  });

  it("returns insider transactions from yahoo", async () => {
    const res = await handleInsiders("AAPL", makeEnv());
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      symbol: string;
      transactions: Array<{ name: string; type: string }>;
      count: number;
    };
    expect(body.symbol).toBe("AAPL");
    expect(body.transactions).toHaveLength(2);
    expect(body.count).toBe(2);
  });

  it("classifies buy and sell transactions", async () => {
    const res = await handleInsiders("AAPL", makeEnv());
    const body = (await res.json()) as {
      transactions: Array<{ name: string; type: string }>;
    };
    const sale = body.transactions.find((t) => t.name === "Tim Cook");
    const purchase = body.transactions.find((t) => t.name === "Art Levinson");
    expect(sale?.type).toBe("sell");
    expect(purchase?.type).toBe("buy");
  });

  it("returns cached data when available", async () => {
    const cached = {
      symbol: "AAPL",
      transactions: [],
      count: 0,
      source: "yahoo",
    };
    mockKvStore.get.mockResolvedValue(JSON.stringify(cached));
    const res = await handleInsiders("AAPL", makeEnv());
    const body = (await res.json()) as { source: string };
    expect(body.source).toBe("cache");
  });

  it("returns 502 when upstream fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    const res = await handleInsiders("AAPL", makeEnv());
    expect(res.status).toBe(502);
  });

  it("handles empty insider data gracefully", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ quoteSummary: { result: [{}] } }),
      }),
    );
    const res = await handleInsiders("GOOG", makeEnv());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { transactions: unknown[]; count: number };
    expect(body.transactions).toHaveLength(0);
  });

  it("caches result in KV", async () => {
    await handleInsiders("AAPL", makeEnv());
    expect(mockKvStore.put).toHaveBeenCalled();
  });
});
