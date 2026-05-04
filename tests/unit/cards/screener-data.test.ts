/**
 * Screener data bridge tests.
 *
 * Validates getter/setter pair and round-trip integrity.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { setScreenerData, getScreenerData } from "../../../src/cards/screener-data";
import type { ScreenerInput } from "../../../src/cards/screener";

describe("screener-data bridge", () => {
  beforeEach(() => {
    setScreenerData([]);
  });

  it("returns empty array by default", () => {
    expect(getScreenerData()).toEqual([]);
  });

  it("stores and retrieves screener inputs", () => {
    const inputs: ScreenerInput[] = [
      {
        ticker: "AAPL",
        price: 190,
        consensus: "BUY",
        rsi: 55,
        volumeRatio: 1.33,
        smaValues: new Map([
          [50, 185],
          [200, 170],
        ]),
        pe: 28,
        marketCap: 3e12,
        dividendYield: 0.5,
        sector: "Technology",
      },
    ];
    setScreenerData(inputs);
    expect(getScreenerData()).toEqual(inputs);
    expect(getScreenerData()).toHaveLength(1);
  });

  it("overwrites previous data on re-set", () => {
    const first: ScreenerInput[] = [
      {
        ticker: "A",
        price: 1,
        consensus: "SELL",
        rsi: 20,
        volumeRatio: 2.0,
        smaValues: new Map([[200, 1]]),
        pe: null,
        marketCap: null,
        dividendYield: null,
        sector: null,
      },
      {
        ticker: "B",
        price: 2,
        consensus: "BUY",
        rsi: 80,
        volumeRatio: 2.0,
        smaValues: new Map([[200, 2]]),
        pe: null,
        marketCap: null,
        dividendYield: null,
        sector: null,
      },
    ];
    setScreenerData(first);
    expect(getScreenerData()).toHaveLength(2);

    setScreenerData([]);
    expect(getScreenerData()).toHaveLength(0);
  });
});
