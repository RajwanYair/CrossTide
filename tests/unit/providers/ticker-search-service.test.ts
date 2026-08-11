/**
 * Ticker search service tests — worker-first resolution with provider fallback.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const workerSearch = vi.fn();
const chainSearch = vi.fn();
const recordSearch = vi.fn();

vi.mock("../../../src/core/worker-api-client", () => ({
  getApiClient: () => ({ search: workerSearch }),
}));

vi.mock("../../../src/providers/provider-registry", () => ({
  getChain: () => ({ search: chainSearch }),
}));

vi.mock("../../../src/core/search-history", () => ({
  recordSearch,
}));

const { searchTickers } = await import("../../../src/providers/ticker-search-service");

describe("searchTickers", () => {
  beforeEach(() => {
    workerSearch.mockReset();
    chainSearch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns nothing for a blank query without hitting any source", async () => {
    await expect(searchTickers("  ")).resolves.toEqual([]);
    expect(workerSearch).not.toHaveBeenCalled();
    expect(chainSearch).not.toHaveBeenCalled();
  });

  it("maps worker hits onto the provider SearchResult shape", async () => {
    workerSearch.mockResolvedValue({
      ok: true,
      value: {
        results: [{ ticker: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", type: "stock" }],
      },
    });

    await expect(searchTickers("aapl")).resolves.toEqual([
      { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", type: "stock" },
    ]);
    expect(recordSearch).toHaveBeenCalledWith("aapl");
    expect(chainSearch).not.toHaveBeenCalled();
  });

  it("falls back to the provider chain when the worker errors", async () => {
    workerSearch.mockResolvedValue({ ok: false, error: new Error("HTTP 502") });
    chainSearch.mockResolvedValue([{ symbol: "MSFT", name: "Microsoft", exchange: "NASDAQ" }]);

    await expect(searchTickers("msft")).resolves.toEqual([
      { symbol: "MSFT", name: "Microsoft", exchange: "NASDAQ" },
    ]);
  });

  it("falls back to the provider chain when the worker returns no hits", async () => {
    workerSearch.mockResolvedValue({ ok: true, value: { results: [] } });
    chainSearch.mockResolvedValue([{ symbol: "TSLA", name: "Tesla", exchange: "NASDAQ" }]);

    await expect(searchTickers("tsla")).resolves.toHaveLength(1);
  });

  it("resolves to an empty array when every source fails", async () => {
    workerSearch.mockResolvedValue({ ok: false, error: new Error("offline") });
    chainSearch.mockRejectedValue(new Error("CORS blocked"));

    await expect(searchTickers("aapl")).resolves.toEqual([]);
  });
});
