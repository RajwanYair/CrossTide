import { describe, it, expect, beforeEach, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
});

describe("ticker-selection", () => {
  async function loadModule() {
    return import("../../../src/core/ticker-selection");
  }

  it("starts with empty selection", async () => {
    const { getSelectedTickers, getSelectionCount } = await loadModule();
    expect(getSelectedTickers()).toEqual([]);
    expect(getSelectionCount()).toBe(0);
  });

  it("selectTicker adds a ticker", async () => {
    const { selectTicker, isTickerSelected, getSelectionCount } = await loadModule();
    selectTicker("AAPL");
    expect(isTickerSelected("AAPL")).toBe(true);
    expect(getSelectionCount()).toBe(1);
  });

  it("normalizes to uppercase", async () => {
    const { selectTicker, isTickerSelected } = await loadModule();
    selectTicker("aapl");
    expect(isTickerSelected("AAPL")).toBe(true);
  });

  it("deselectTicker removes a ticker", async () => {
    const { selectTicker, deselectTicker, isTickerSelected } = await loadModule();
    selectTicker("AAPL");
    deselectTicker("AAPL");
    expect(isTickerSelected("AAPL")).toBe(false);
  });

  it("toggleTickerSelection toggles", async () => {
    const { toggleTickerSelection, isTickerSelected } = await loadModule();
    const added = toggleTickerSelection("MSFT");
    expect(added).toBe(true);
    expect(isTickerSelected("MSFT")).toBe(true);
    const removed = toggleTickerSelection("MSFT");
    expect(removed).toBe(false);
    expect(isTickerSelected("MSFT")).toBe(false);
  });

  it("selectAll adds multiple tickers", async () => {
    const { selectAll, getSelectionCount, isTickerSelected } = await loadModule();
    selectAll(["AAPL", "MSFT", "GOOG"]);
    expect(getSelectionCount()).toBe(3);
    expect(isTickerSelected("MSFT")).toBe(true);
  });

  it("clearSelection removes all", async () => {
    const { selectAll, clearSelection, getSelectionCount } = await loadModule();
    selectAll(["AAPL", "MSFT"]);
    clearSelection();
    expect(getSelectionCount()).toBe(0);
  });

  it("onSelectionChange is called on changes", async () => {
    const { selectTicker, onSelectionChange } = await loadModule();
    const fn = vi.fn();
    onSelectionChange(fn);
    selectTicker("AAPL");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn.mock.calls[0]![0].has("AAPL")).toBe(true);
  });

  it("unsubscribe stops notifications", async () => {
    const { selectTicker, onSelectionChange } = await loadModule();
    const fn = vi.fn();
    const unsub = onSelectionChange(fn);
    unsub();
    selectTicker("AAPL");
    expect(fn).not.toHaveBeenCalled();
  });

  it("getSelectedTickers returns array", async () => {
    const { selectAll, getSelectedTickers } = await loadModule();
    selectAll(["GOOG", "TSLA"]);
    const result = getSelectedTickers();
    expect(result).toContain("GOOG");
    expect(result).toContain("TSLA");
  });
});
