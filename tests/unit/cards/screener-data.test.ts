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
        volume: 80_000_000,
        avgVolume: 60_000_000,
        close: 190,
        sma50: 185,
        sma200: 170,
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
        volume: 1000,
        avgVolume: 500,
        close: 1,
        sma50: 1,
        sma200: 1,
      },
      {
        ticker: "B",
        price: 2,
        consensus: "BUY",
        rsi: 80,
        volume: 2000,
        avgVolume: 1000,
        close: 2,
        sma50: 2,
        sma200: 2,
      },
    ];
    setScreenerData(first);
    expect(getScreenerData()).toHaveLength(2);

    setScreenerData([]);
    expect(getScreenerData()).toHaveLength(0);
  });
});
