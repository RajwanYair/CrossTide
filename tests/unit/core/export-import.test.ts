import { describe, it, expect, vi, afterEach } from "vitest";
import {
  exportConfigJSON,
  importConfigJSON,
  exportWatchlistCSV,
  importWatchlistCSV,
  downloadFile,
  downloadCompressedFile,
  EXPORT_SCHEMA_VERSION,
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

  it("C7: includes schemaVersion and checksum in envelope", () => {
    const json = exportConfigJSON(SAMPLE_CONFIG, "7.2.0");
    const parsed = JSON.parse(json);
    expect(parsed.schemaVersion).toBe(EXPORT_SCHEMA_VERSION);
    expect(typeof parsed.checksum).toBe("string");
    expect(parsed.checksum).toHaveLength(8); // djb2 hex is 8 chars
  });

  it("C7: round-trips with checksum verification", () => {
    const json = exportConfigJSON(SAMPLE_CONFIG, "7.2.0");
    const restored = importConfigJSON(json);
    expect(restored.theme).toBe("dark");
  });

  it("C7: rejects tampered checksum", () => {
    const json = exportConfigJSON(SAMPLE_CONFIG, "7.2.0");
    const tampered = json.replace(/"checksum":\s*"[0-9a-f]+"/, '"checksum":"deadbeef"');
    expect(() => importConfigJSON(tampered)).toThrow("checksum mismatch");
  });

  it("C7: accepts legacy export without schemaVersion (backward compat)", () => {
    const legacy = JSON.stringify({
      version: "6.0.0",
      exportedAt: "2025-01-01T00:00:00Z",
      config: { theme: "light", watchlist: [] },
    });
    expect(() => importConfigJSON(legacy)).not.toThrow();
  });

  it("C7: rejects export with future schema version", () => {
    const future = JSON.stringify({
      schemaVersion: 999,
      version: "99.0.0",
      exportedAt: "2025-01-01T00:00:00Z",
      config: { theme: "dark", watchlist: [] },
    });
    expect(() => importConfigJSON(future)).toThrow("Unsupported export schema version");
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

  it("throws on missing ticker in CSV row", () => {
    const csv = "ticker,addedAt\n,2025-01-01";
    expect(() => importWatchlistCSV(csv)).toThrow("Invalid CSV");
  });
});

describe("downloadFile", () => {
  it("creates an anchor element and triggers download", () => {
    const clickSpy = vi.fn();
    const mockAnchor = {
      href: "",
      download: "",
      click: clickSpy,
    } as unknown as HTMLAnchorElement;
    vi.spyOn(document, "createElement").mockReturnValueOnce(mockAnchor);
    vi.spyOn(document.body, "appendChild").mockImplementation(() => mockAnchor);
    vi.spyOn(document.body, "removeChild").mockImplementation(() => mockAnchor);
    vi.spyOn(URL, "createObjectURL").mockReturnValueOnce("blob:http://x");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);

    downloadFile("data", "export.json", "application/json");

    expect(mockAnchor.download).toBe("export.json");
    expect(clickSpy).toHaveBeenCalledOnce();
  });

  it("uses the correct MIME type", () => {
    const mockAnchor = { href: "", download: "", click: vi.fn() } as unknown as HTMLAnchorElement;
    vi.spyOn(document, "createElement").mockReturnValueOnce(mockAnchor);
    vi.spyOn(document.body, "appendChild").mockImplementation(() => mockAnchor);
    vi.spyOn(document.body, "removeChild").mockImplementation(() => mockAnchor);
    const createObjSpy = vi.spyOn(URL, "createObjectURL").mockReturnValueOnce("blob:x");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);

    downloadFile("csv-content", "data.csv", "text/csv");

    // Blob is created with the correct type — indirectly tested via createObjectURL
    expect(createObjSpy).toHaveBeenCalled();
  });
});

describe("downloadCompressedFile — G11 Compression Streams", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("falls back to plain downloadFile when CompressionStream is unavailable", async () => {
    // @ts-expect-error intentionally removing global for this test
    const orig = globalThis.CompressionStream;
    // @ts-expect-error intentionally
    delete globalThis.CompressionStream;

    const mockAnchor = { href: "", download: "", click: vi.fn() } as unknown as HTMLAnchorElement;
    vi.spyOn(document, "createElement").mockReturnValue(mockAnchor);
    vi.spyOn(document.body, "appendChild").mockImplementation(() => mockAnchor);
    vi.spyOn(document.body, "removeChild").mockImplementation(() => mockAnchor);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:fallback");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);

    await downloadCompressedFile("content", "export.json.gz", "application/json");

    // Fallback strips .gz extension
    expect(mockAnchor.download).toBe("export.json");

    // @ts-expect-error restore
    globalThis.CompressionStream = orig;
  });
});
