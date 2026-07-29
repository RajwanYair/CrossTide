import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AlphaVantageApiError,
  fetchAlphaVantageQuote,
} from "../../../worker/providers/alpha-vantage.js";
import {
  fetchFrankfurterRate,
  FrankfurterApiError,
} from "../../../worker/providers/frankfurter.js";
import {
  fetchMassiveHistory,
  fetchMassiveQuote,
  MassiveApiError,
} from "../../../worker/providers/massive.js";

describe("open and free-tier worker providers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps a Massive previous-close aggregate", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          status: "OK",
          results: [{ o: 100, h: 105, l: 99, c: 104, v: 1_000, t: 1_704_153_600_000 }],
        }),
      ),
    );

    const quote = await fetchMassiveQuote("AAPL", "key");
    expect(quote).toMatchObject({ ticker: "AAPL", price: 104, volume: 1_000 });
    expect(String(vi.mocked(fetch).mock.calls[0]?.[0])).toContain("apiKey=key");
  });

  it("rejects malformed Massive history bars", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ status: "OK", results: [{ c: 104 }] })),
    );

    await expect(fetchMassiveHistory("AAPL", 30, "key")).rejects.toBeInstanceOf(MassiveApiError);
  });

  it("maps an Alpha Vantage global quote", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          "Global Quote": {
            "01. symbol": "MSFT",
            "02. open": "410",
            "03. high": "420",
            "04. low": "408",
            "05. price": "418",
            "06. volume": "5000",
            "08. previous close": "412",
          },
        }),
      ),
    );

    const quote = await fetchAlphaVantageQuote("MSFT", "key");
    expect(quote).toMatchObject({ ticker: "MSFT", price: 418, previousClose: 412 });
  });

  it("rejects Alpha Vantage rate-limit envelopes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ Note: "API call frequency exceeded" })),
    );

    await expect(fetchAlphaVantageQuote("MSFT", "key")).rejects.toBeInstanceOf(
      AlphaVantageApiError,
    );
  });

  it("maps a Frankfurter v2 pair rate", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ date: "2026-07-29", base: "EUR", quote: "USD", rate: 1.16 }),
        ),
    );

    await expect(fetchFrankfurterRate("EUR", "USD")).resolves.toEqual({
      date: "2026-07-29",
      base: "EUR",
      quote: "USD",
      rate: 1.16,
    });
  });

  it("rejects malformed Frankfurter rates", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ rate: 0 })));

    await expect(fetchFrankfurterRate("EUR", "USD")).rejects.toBeInstanceOf(FrankfurterApiError);
  });
});
