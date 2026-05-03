/**
 * App store tests — reactive state signals.
 *
 * Validates initial values, read/write, and subscription semantics.
 */
import { describe, it, expect, vi } from "vitest";
import {
  tickerDataStore,
  selectedTickerStore,
  loadingStore,
  type TickerSnapshot,
} from "../../../src/core/app-store";

describe("app-store", () => {
  it("tickerDataStore defaults to empty Map", () => {
    const value = tickerDataStore();
    expect(value).toBeInstanceOf(Map);
    expect(value.size).toBe(0);
  });

  it("selectedTickerStore defaults to empty string", () => {
    expect(selectedTickerStore()).toBe("");
  });

  it("loadingStore defaults to false", () => {
    expect(loadingStore()).toBe(false);
  });

  it("can set and read selectedTickerStore", () => {
    selectedTickerStore.set("AAPL");
    expect(selectedTickerStore.peek()).toBe("AAPL");
    // reset
    selectedTickerStore.set("");
  });

  it("can set and read loadingStore", () => {
    loadingStore.set(true);
    expect(loadingStore.peek()).toBe(true);
    loadingStore.set(false);
  });

  it("can set and read tickerDataStore", () => {
    const snap: TickerSnapshot = {
      ticker: "MSFT",
      price: 420,
      change: 5,
      changePercent: 1.2,
      volume: 30_000_000,
      avgVolume: 25_000_000,
      high52w: 450,
      low52w: 300,
      closes30d: [410, 415, 420],
      consensus: null,
      candles: [],
    };
    const map = new Map<string, TickerSnapshot>([["MSFT", snap]]);
    tickerDataStore.set(map);
    expect(tickerDataStore.peek().get("MSFT")).toEqual(snap);
    // reset
    tickerDataStore.set(new Map());
  });

  it("subscribe fires on change", () => {
    const cb = vi.fn();
    loadingStore.set(false); // ensure known starting state
    const unsub = loadingStore.subscribe(cb);
    loadingStore.set(true);
    expect(cb).toHaveBeenCalled();
    unsub();
    loadingStore.set(false);
  });
});
