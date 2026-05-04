import { describe, it, expect, beforeEach, vi } from "vitest";

function createStorageMock(): Storage {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
  };
}

beforeEach(() => {
  vi.stubGlobal("localStorage", createStorageMock());
  vi.resetModules();
});

describe("ticker-tags", () => {
  async function loadModule() {
    return import("../../../src/core/ticker-tags");
  }

  it("returns undefined for untagged ticker", async () => {
    const { getTickerTag } = await loadModule();
    expect(getTickerTag("AAPL")).toBeUndefined();
  });

  it("sets and retrieves a tag", async () => {
    const { setTickerTag, getTickerTag } = await loadModule();
    setTickerTag("AAPL", { color: "green", label: "Bullish" });
    expect(getTickerTag("AAPL")).toEqual({ color: "green", label: "Bullish" });
  });

  it("normalizes ticker to uppercase", async () => {
    const { setTickerTag, getTickerTag } = await loadModule();
    setTickerTag("aapl", { color: "red", label: "Bearish" });
    expect(getTickerTag("AAPL")).toEqual({ color: "red", label: "Bearish" });
  });

  it("removes a tag", async () => {
    const { setTickerTag, removeTickerTag, getTickerTag } = await loadModule();
    setTickerTag("MSFT", { color: "blue", label: "Watch" });
    removeTickerTag("MSFT");
    expect(getTickerTag("MSFT")).toBeUndefined();
  });

  it("persists to localStorage", async () => {
    const { setTickerTag } = await loadModule();
    setTickerTag("GOOG", { color: "orange", label: "Earnings" });
    const raw = localStorage.getItem("crosstide-ticker-tags");
    expect(raw).toContain("GOOG");
    expect(raw).toContain("orange");
  });

  it("loads from localStorage on fresh import", async () => {
    localStorage.setItem(
      "crosstide-ticker-tags",
      JSON.stringify({ TSLA: { color: "purple", label: "Speculative" } }),
    );
    const { getTickerTag } = await loadModule();
    expect(getTickerTag("TSLA")).toEqual({ color: "purple", label: "Speculative" });
  });

  it("hasTickerTag returns correct boolean", async () => {
    const { setTickerTag, hasTickerTag } = await loadModule();
    expect(hasTickerTag("AAPL")).toBe(false);
    setTickerTag("AAPL", { color: "green", label: "Bullish" });
    expect(hasTickerTag("AAPL")).toBe(true);
  });

  it("getAllTickerTags returns all entries", async () => {
    const { setTickerTag, getAllTickerTags } = await loadModule();
    setTickerTag("AAPL", { color: "green", label: "Bullish" });
    setTickerTag("MSFT", { color: "red", label: "Bearish" });
    const all = getAllTickerTags();
    expect(all.size).toBe(2);
  });

  it("tagColorToCss returns CSS variable", async () => {
    const { tagColorToCss } = await loadModule();
    expect(tagColorToCss("green")).toContain("--tag-green");
    expect(tagColorToCss("red")).toContain("--tag-red");
  });
});
