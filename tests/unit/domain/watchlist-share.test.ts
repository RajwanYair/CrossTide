/**
 * Unit tests for collaborative watchlist sharing (I8).
 */
import { describe, it, expect } from "vitest";
import {
  createWatchlistSnapshot,
  encodeWatchlistUrl,
  decodeWatchlistUrl,
  decodeWatchlistPayload,
  mergeWatchlists,
  snapshotToText,
} from "../../../src/domain/watchlist-share";
import { base64UrlEncode } from "../../../src/core/base64-url";

// ── createWatchlistSnapshot ──────────────────────────────────────────────

describe("createWatchlistSnapshot", () => {
  it("creates a valid snapshot", () => {
    const snap = createWatchlistSnapshot("Tech", ["AAPL", "MSFT", "GOOG"]);
    expect(snap.v).toBe(1);
    expect(snap.name).toBe("Tech");
    expect(snap.tickers).toEqual(["AAPL", "MSFT", "GOOG"]);
    expect(snap.createdAt).toBeTruthy();
    expect(snap.checksum).toBeTruthy();
  });

  it("includes optional notes", () => {
    const snap = createWatchlistSnapshot("X", ["AAPL"], { notes: "My picks" });
    expect(snap.notes).toBe("My picks");
  });

  it("includes optional TTL", () => {
    const snap = createWatchlistSnapshot("X", ["AAPL"], { ttlSeconds: 3600 });
    expect(snap.ttlSeconds).toBe(3600);
  });

  it("truncates long notes", () => {
    const longNotes = "a".repeat(600);
    const snap = createWatchlistSnapshot("X", ["AAPL"], { notes: longNotes });
    expect(snap.notes!.length).toBe(500);
  });

  it("throws on empty name", () => {
    expect(() => createWatchlistSnapshot("", ["AAPL"])).toThrow("name is required");
  });

  it("throws on empty tickers", () => {
    expect(() => createWatchlistSnapshot("X", [])).toThrow("must not be empty");
  });

  it("throws on too many tickers", () => {
    const tickers = Array.from({ length: 201 }, (_, i) => `T${i}`);
    expect(() => createWatchlistSnapshot("X", tickers)).toThrow("exceeds max");
  });

  it("throws on invalid ticker", () => {
    expect(() => createWatchlistSnapshot("X", [""])).toThrow("invalid ticker");
  });
});

// ── encodeWatchlistUrl / decodeWatchlistUrl ───────────────────────────────

describe("encode / decode URL", () => {
  it("round-trips a snapshot through URL", () => {
    const snap = createWatchlistSnapshot("Tech", ["AAPL", "MSFT"]);
    const url = encodeWatchlistUrl(snap, "https://crosstide.app");
    expect(url).toContain("wl=");

    const result = decodeWatchlistUrl(url);
    expect(result.ok).toBe(true);
    expect(result.snapshot!.name).toBe("Tech");
    expect(result.snapshot!.tickers).toEqual(["AAPL", "MSFT"]);
  });

  it("preserves notes through round-trip", () => {
    const snap = createWatchlistSnapshot("X", ["GOOG"], { notes: "Growth" });
    const url = encodeWatchlistUrl(snap, "https://crosstide.app");
    const result = decodeWatchlistUrl(url);
    expect(result.snapshot!.notes).toBe("Growth");
  });

  it("returns error for missing param", () => {
    const result = decodeWatchlistUrl("https://crosstide.app/share");
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Missing");
  });

  it("returns error for invalid URL", () => {
    const result = decodeWatchlistUrl("not-a-url");
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Invalid URL");
  });
});

// ── decodeWatchlistPayload ───────────────────────────────────────────────

describe("decodeWatchlistPayload", () => {
  it("detects checksum mismatch", () => {
    const snap = createWatchlistSnapshot("X", ["AAPL"]);
    const tampered = { ...snap, tickers: ["MSFT"] };
    const encoded = base64UrlEncode(JSON.stringify(tampered));
    const result = decodeWatchlistPayload(encoded);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Checksum");
  });

  it("detects unsupported version", () => {
    const payload = { v: 99, name: "X", tickers: ["AAPL"], checksum: "x" };
    const encoded = base64UrlEncode(JSON.stringify(payload));
    const result = decodeWatchlistPayload(encoded);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("version");
  });

  it("detects missing name", () => {
    const payload = { v: 1, tickers: ["AAPL"] };
    const encoded = base64UrlEncode(JSON.stringify(payload));
    const result = decodeWatchlistPayload(encoded);
    expect(result.ok).toBe(false);
  });

  it("detects expired snapshot", () => {
    const snap = createWatchlistSnapshot("X", ["AAPL"], { ttlSeconds: 60 });
    // Modify createdAt to 2 hours ago
    const expired = { ...snap, createdAt: new Date(Date.now() - 7200_000).toISOString() };
    // Re-encode with correct checksum (checksum doesn't include createdAt)
    const encoded = base64UrlEncode(JSON.stringify(expired));
    const result = decodeWatchlistPayload(encoded, new Date());
    expect(result.ok).toBe(false);
    expect(result.expired).toBe(true);
  });

  it("accepts non-expired snapshot", () => {
    const snap = createWatchlistSnapshot("X", ["AAPL"], { ttlSeconds: 3600 });
    const encoded = base64UrlEncode(JSON.stringify(snap));
    const result = decodeWatchlistPayload(encoded, new Date());
    expect(result.ok).toBe(true);
  });

  it("returns error for garbage input", () => {
    const result = decodeWatchlistPayload("!@#$%");
    expect(result.ok).toBe(false);
  });
});

// ── mergeWatchlists ──────────────────────────────────────────────────────

describe("mergeWatchlists", () => {
  it("merges non-overlapping lists", () => {
    const result = mergeWatchlists(["AAPL", "MSFT"], ["GOOG", "AMZN"]);
    expect(result.tickers).toEqual(["AAPL", "MSFT", "GOOG", "AMZN"]);
    expect(result.added).toEqual(["GOOG", "AMZN"]);
    expect(result.duplicates).toEqual([]);
  });

  it("detects duplicates", () => {
    const result = mergeWatchlists(["AAPL", "MSFT"], ["MSFT", "GOOG"]);
    expect(result.tickers).toEqual(["AAPL", "MSFT", "GOOG"]);
    expect(result.added).toEqual(["GOOG"]);
    expect(result.duplicates).toEqual(["MSFT"]);
  });

  it("handles empty existing list", () => {
    const result = mergeWatchlists([], ["AAPL"]);
    expect(result.tickers).toEqual(["AAPL"]);
    expect(result.added).toEqual(["AAPL"]);
  });

  it("handles empty incoming list", () => {
    const result = mergeWatchlists(["AAPL"], []);
    expect(result.tickers).toEqual(["AAPL"]);
    expect(result.added).toEqual([]);
  });

  it("handles all duplicates", () => {
    const result = mergeWatchlists(["AAPL", "MSFT"], ["AAPL", "MSFT"]);
    expect(result.tickers).toEqual(["AAPL", "MSFT"]);
    expect(result.added).toEqual([]);
    expect(result.duplicates).toEqual(["AAPL", "MSFT"]);
  });
});

// ── snapshotToText ───────────────────────────────────────────────────────

describe("snapshotToText", () => {
  it("formats snapshot as text", () => {
    const snap = createWatchlistSnapshot("Tech", ["AAPL", "MSFT"]);
    const text = snapshotToText(snap);
    expect(text).toContain("Tech");
    expect(text).toContain("AAPL, MSFT");
    expect(text).toContain("Created:");
  });

  it("includes notes when present", () => {
    const snap = createWatchlistSnapshot("X", ["GOOG"], { notes: "Growth" });
    const text = snapshotToText(snap);
    expect(text).toContain("Notes: Growth");
  });
});
