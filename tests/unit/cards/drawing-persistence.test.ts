/**
 * Drawing persistence tests.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  saveDrawings,
  loadDrawings,
  clearAllSavedDrawings,
} from "../../../src/cards/drawing-persistence";
import type { Drawing } from "../../../src/cards/drawing-tools";

function storageMock(): Storage {
  const store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
}

describe("drawing-persistence", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", storageMock());
  });

  it("returns empty array when nothing saved", () => {
    expect(loadDrawings("AAPL")).toEqual([]);
  });

  it("saves and loads drawings for a ticker", () => {
    const drawings: Drawing[] = [
      { kind: "hline", y: 100, color: "#ff0" },
      { kind: "trendline", p1: { x: 0, y: 0 }, p2: { x: 100, y: 100 }, color: "#0f0" },
    ];
    saveDrawings("AAPL", drawings);
    const loaded = loadDrawings("AAPL");
    expect(loaded).toEqual(drawings);
  });

  it("is case-insensitive for ticker", () => {
    const drawings: Drawing[] = [{ kind: "hline", y: 50, color: "#f00" }];
    saveDrawings("aapl", drawings);
    expect(loadDrawings("AAPL")).toEqual(drawings);
  });

  it("removes entry when saving empty array", () => {
    saveDrawings("MSFT", [{ kind: "hline", y: 75, color: "#0ff" }]);
    saveDrawings("MSFT", []);
    expect(loadDrawings("MSFT")).toEqual([]);
  });

  it("evicts oldest ticker when exceeding max", () => {
    // Save 50 tickers
    for (let i = 0; i < 50; i++) {
      saveDrawings(`T${i}`, [{ kind: "hline", y: i, color: "#000" }]);
    }
    // 51st should evict T0
    saveDrawings("NEW", [{ kind: "hline", y: 999, color: "#fff" }]);
    expect(loadDrawings("T0")).toEqual([]);
    expect(loadDrawings("NEW")).toHaveLength(1);
  });

  it("clearAllSavedDrawings removes everything", () => {
    saveDrawings("AAPL", [{ kind: "hline", y: 100, color: "#ff0" }]);
    saveDrawings("MSFT", [{ kind: "hline", y: 200, color: "#0f0" }]);
    clearAllSavedDrawings();
    expect(loadDrawings("AAPL")).toEqual([]);
    expect(loadDrawings("MSFT")).toEqual([]);
  });
});
