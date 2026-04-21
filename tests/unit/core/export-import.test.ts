import { describe, it, expect } from "vitest";
import {
  exportConfigJSON,
  importConfigJSON,
  exportWatchlistCSV,
  importWatchlistCSV,
} from "../../../src/core/export-import";
import type { AppConfig } from "../../../src/types/domain";

const SAMPLE_CONFIG: AppConfig = {
  theme: "dark",
  watchlist: [
    { ticker: "AAPL", addedAt: "2025-01-01T00:00:00.000Z" },
    { ticker: "MSFT", addedAt: "2025-01-02T00:00:00.000Z" },
  ],
};

describe("exportConfigJSON / importConfigJSON", () => {
  it("round-trips config through JSON", () => {
    const json = exportConfigJSON(SAMPLE_CONFIG, "6.0.0");
    const restored = importConfigJSON(json);
    expect(restored.theme).toBe("dark");
    expect(restored.watchlist).toHaveLength(2);
    expect(restored.watchlist[0]!.ticker).toBe("AAPL");
  });

  it("includes version and exportedAt", () => {
    const json = exportConfigJSON(SAMPLE_CONFIG, "6.0.0");
    const parsed = JSON.parse(json);
    expect(parsed.version).toBe("6.0.0");
    expect(parsed.exportedAt).toBeDefined();
  });

  it("rejects invalid JSON", () => {
    expect(() => importConfigJSON("not json")).toThrow();
  });

  it("rejects missing config", () => {
    expect(() => importConfigJSON('{"version":"1"}')).toThrow("Missing config");
  });

  it("rejects invalid theme", () => {
    const bad = JSON.stringify({ config: { theme: "blue", watchlist: [] } });
    expect(() => importConfigJSON(bad)).toThrow("Invalid theme");
  });

  it("rejects invalid watchlist", () => {
    const bad = JSON.stringify({ config: { theme: "dark", watchlist: "not array" } });
    expect(() => importConfigJSON(bad)).toThrow("Invalid watchlist");
  });

  it("rejects watchlist entry without ticker", () => {
    const bad = JSON.stringify({
      config: { theme: "dark", watchlist: [{ addedAt: "2025-01-01" }] },
    });
    expect(() => importConfigJSON(bad)).toThrow("Invalid ticker");
  });
});

describe("exportWatchlistCSV / importWatchlistCSV", () => {
  it("round-trips watchlist through CSV", () => {
    const csv = exportWatchlistCSV(SAMPLE_CONFIG.watchlist);
    const restored = importWatchlistCSV(csv);
    expect(restored).toHaveLength(2);
    expect(restored[0]!.ticker).toBe("AAPL");
    expect(restored[1]!.ticker).toBe("MSFT");
  });

  it("CSV has header row", () => {
    const csv = exportWatchlistCSV(SAMPLE_CONFIG.watchlist);
    expect(csv.startsWith("ticker,addedAt")).toBe(true);
  });

  it("returns empty array for header-only CSV", () => {
    expect(importWatchlistCSV("ticker,addedAt")).toEqual([]);
  });

  it("uppercases tickers on import", () => {
    const csv = "ticker,addedAt\naapl,2025-01-01";
    const result = importWatchlistCSV(csv);
    expect(result[0]!.ticker).toBe("AAPL");
  });

  it("handles missing addedAt gracefully", () => {
    const csv = "ticker,addedAt\nAAPL,";
    const result = importWatchlistCSV(csv);
    expect(result[0]!.ticker).toBe("AAPL");
    expect(result[0]!.addedAt).toBeDefined();
  });
});
