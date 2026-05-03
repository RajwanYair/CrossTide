/**
 * Unit tests for fundamental-data domain module.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { fetchFundamentals, clearFundamentalsCache } from "../../src/domain/fundamental-data";

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function makeQuoteSummaryResponse(overrides: Record<string, unknown> = {}) {
  return {
    quoteSummary: {
      result: [
        {
          defaultKeyStatistics: {
            trailingPE: { raw: 25.3 },
            forwardPE: { raw: 22.1 },
            priceToBook: { raw: 3.5 },
            returnOnEquity: { raw: 0.35 },
            profitMargins: { raw: 0.21 },
          },
          financialData: {
            totalRevenue: { raw: 394_000_000_000 },
            debtToEquity: { raw: 180.5 },
            returnOnEquity: { raw: 0.35 },
            profitMargins: { raw: 0.21 },
          },
          summaryDetail: {
            trailingPE: { raw: 25.3 },
            forwardPE: { raw: 22.1 },
            dividendYield: { raw: 0.005 },
            marketCap: { raw: 2_800_000_000_000 },
            priceToBook: { raw: 3.5 },
          },
          earnings: {
            financialsChart: {
              yearly: [
                {
                  date: 2023,
                  revenue: { raw: 383_000_000_000 },
                  earnings: { raw: 97_000_000_000 },
                },
                {
                  date: 2024,
                  revenue: { raw: 394_000_000_000 },
                  earnings: { raw: 101_000_000_000 },
                },
              ],
            },
          },
          ...overrides,
        },
      ],
    },
  };
}

describe("fetchFundamentals", () => {
  beforeEach(() => {
    clearFundamentalsCache();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches and parses fundamental data correctly", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(makeQuoteSummaryResponse()),
    });

    const result = await fetchFundamentals("AAPL");

    expect(result).not.toBeNull();
    expect(result!.peRatio).toBe(25.3);
    expect(result!.forwardPe).toBe(22.1);
    expect(result!.eps).toBe(101_000_000_000);
    expect(result!.revenue).toBe(394_000_000_000);
    expect(result!.marketCap).toBe(2_800_000_000_000);
    expect(result!.dividendYield).toBe(0.005);
    expect(result!.priceToBook).toBe(3.5);
    expect(result!.debtToEquity).toBe(180.5);
    expect(result!.returnOnEquity).toBe(0.35);
    expect(result!.profitMargin).toBe(0.21);
    expect(result!.fetchedAt).toBeTruthy();
  });

  it("returns cached data on subsequent calls within TTL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(makeQuoteSummaryResponse()),
    });

    const first = await fetchFundamentals("AAPL");
    const second = await fetchFundamentals("AAPL");

    expect(first).toEqual(second);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("returns null on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const result = await fetchFundamentals("INVALID");
    expect(result).toBeNull();
  });

  it("returns null on invalid response shape", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ garbage: true }),
    });

    const result = await fetchFundamentals("AAPL");
    expect(result).toBeNull();
  });

  it("returns null when quoteSummary has no results", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ quoteSummary: { result: [] } }),
    });

    const result = await fetchFundamentals("AAPL");
    expect(result).toBeNull();
  });

  it("handles partial data gracefully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve(
          makeQuoteSummaryResponse({
            financialData: undefined,
            earnings: undefined,
          }),
        ),
    });

    const result = await fetchFundamentals("MSFT");
    expect(result).not.toBeNull();
    expect(result!.peRatio).toBe(25.3);
    expect(result!.revenue).toBeUndefined();
    expect(result!.eps).toBeUndefined();
    expect(result!.debtToEquity).toBeUndefined();
  });

  it("encodes ticker in the URL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(makeQuoteSummaryResponse()),
    });

    await fetchFundamentals("BRK.B");

    const callUrl = mockFetch.mock.calls[0]![0] as string;
    expect(callUrl).toContain("BRK.B");
    expect(callUrl).toContain("quoteSummary");
  });
});
