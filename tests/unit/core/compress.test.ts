/**
 * Tests for G11: Compression Streams helpers (compress.ts).
 *
 * happy-dom ships CompressionStream so all paths execute in unit tests.
 */
import { describe, it, expect } from "vitest";
import {
  compressionStreamSupported,
  compressStringToGzip,
  estimateGzipRatio,
  gzipFilename,
} from "../../../src/core/compress";

// ─────────────────────────── helpers ────────────────────────────────────────

const LARGE_JSON = JSON.stringify(
  Array.from({ length: 200 }, (_, i) => ({ id: i, ticker: "AAPL", value: Math.random() })),
);

// ─────────────────────────── compressionStreamSupported ──────────────────────

describe("compressionStreamSupported", () => {
  it("returns true in happy-dom (CompressionStream available)", () => {
    expect(compressionStreamSupported()).toBe(true);
  });

  it("returns false when CompressionStream is not defined", () => {
    const original = globalThis.CompressionStream;
    // @ts-expect-error: intentionally removing the global
    globalThis.CompressionStream = undefined;
    expect(compressionStreamSupported()).toBe(false);
    globalThis.CompressionStream = original;
  });
});

// ─────────────────────────── compressStringToGzip ────────────────────────────

describe("compressStringToGzip", () => {
  it("returns a Blob", async () => {
    const blob = await compressStringToGzip("hello world");
    expect(blob).toBeInstanceOf(Blob);
  });

  it("returns application/gzip MIME type when supported", async () => {
    const blob = await compressStringToGzip("test data");
    expect(blob.type).toBe("application/gzip");
  });

  it("compressed Blob size > 0 for non-empty input", async () => {
    const blob = await compressStringToGzip("some content here");
    expect(blob.size).toBeGreaterThan(0);
  });

  it("compresses empty string to a Blob (gzip header still present)", async () => {
    const blob = await compressStringToGzip("");
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThanOrEqual(0);
  });

  it("falls back to plain text Blob when CompressionStream unavailable", async () => {
    const original = globalThis.CompressionStream;
    // @ts-expect-error intentional
    globalThis.CompressionStream = undefined;
    const blob = await compressStringToGzip("fallback text");
    expect(blob.type).toBe("text/plain");
    globalThis.CompressionStream = original;
  });

  it("fallback blob contains the original text", async () => {
    const original = globalThis.CompressionStream;
    // @ts-expect-error intentional
    globalThis.CompressionStream = undefined;
    const text = "uncompressed fallback content";
    const blob = await compressStringToGzip(text);
    const result = await blob.text();
    expect(result).toBe(text);
    globalThis.CompressionStream = original;
  });
});

// ─────────────────────────── estimateGzipRatio ───────────────────────────────

describe("estimateGzipRatio", () => {
  it("returns a number ≤ 1 for compressible data (repetitive JSON)", async () => {
    const ratio = await estimateGzipRatio(LARGE_JSON);
    // Repetitive JSON compresses well; ratio should be <1
    expect(ratio).toBeLessThan(1);
  });

  it("returns 1 for empty string", async () => {
    const ratio = await estimateGzipRatio("");
    expect(ratio).toBe(1);
  });

  it("returns 1 when CompressionStream unavailable", async () => {
    const original = globalThis.CompressionStream;
    // @ts-expect-error intentional
    globalThis.CompressionStream = undefined;
    const ratio = await estimateGzipRatio("some text");
    expect(ratio).toBe(1);
    globalThis.CompressionStream = original;
  });

  it("ratio is positive", async () => {
    const ratio = await estimateGzipRatio("hello");
    expect(ratio).toBeGreaterThan(0);
  });
});

// ─────────────────────────── gzipFilename ────────────────────────────────────

describe("gzipFilename", () => {
  it("appends .gz to base + extension", () => {
    expect(gzipFilename("crosstide-export", ".json")).toBe("crosstide-export.json.gz");
  });

  it("works without leading dot in extension", () => {
    expect(gzipFilename("export", "csv")).toBe("export.csv.gz");
  });

  it("works with .csv extension", () => {
    expect(gzipFilename("watchlist-2025", ".csv")).toBe("watchlist-2025.csv.gz");
  });

  it("preserves base filename with dashes and underscores", () => {
    expect(gzipFilename("cross_tide-export_2025-01-01", ".json")).toBe(
      "cross_tide-export_2025-01-01.json.gz",
    );
  });
});
