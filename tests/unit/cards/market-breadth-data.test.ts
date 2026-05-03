/**
 * Market breadth data bridge tests.
 *
 * Validates getter/setter pair and immutability semantics.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  setBreadthData,
  getBreadthData,
  type BreadthEntry,
} from "../../../src/cards/market-breadth-data";

describe("market-breadth-data bridge", () => {
  beforeEach(() => {
    setBreadthData([]);
  });

  it("returns empty array before any data is set", () => {
    expect(getBreadthData()).toEqual([]);
  });

  it("stores and retrieves entries", () => {
    const entries: BreadthEntry[] = [
      {
        ticker: "AAPL",
        price: 190,
        changePercent: 1.2,
        consensus: "BUY",
        aboveSma50: true,
        aboveSma200: true,
      },
      {
        ticker: "MSFT",
        price: 420,
        changePercent: -0.5,
        consensus: "NEUTRAL",
        aboveSma50: true,
        aboveSma200: false,
      },
    ];
    setBreadthData(entries);
    expect(getBreadthData()).toEqual(entries);
    expect(getBreadthData()).toHaveLength(2);
  });

  it("overwrites previous data on re-set", () => {
    setBreadthData([
      {
        ticker: "X",
        price: 1,
        changePercent: 0,
        consensus: "SELL",
        aboveSma50: null,
        aboveSma200: null,
      },
    ]);
    expect(getBreadthData()).toHaveLength(1);

    setBreadthData([]);
    expect(getBreadthData()).toHaveLength(0);
  });

  it("preserves null SMA fields", () => {
    const entry: BreadthEntry = {
      ticker: "TEST",
      price: 50,
      changePercent: 0,
      consensus: "NEUTRAL",
      aboveSma50: null,
      aboveSma200: null,
    };
    setBreadthData([entry]);
    const stored = getBreadthData()[0];
    expect(stored.aboveSma50).toBeNull();
    expect(stored.aboveSma200).toBeNull();
  });
});
