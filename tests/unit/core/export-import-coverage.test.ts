/**
 * Export-import coverage boost — targets uncovered lines 90, 159-180.
 *
 * Covers:
 *   - importConfigJSON: watchlist entry with null/undefined
 *   - importConfigJSON: watchlist entry with missing addedAt
 *   - importConfigJSON: non-object payload root
 *   - downloadCompressedFile with CompressionStream available
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  importConfigJSON,
  downloadCompressedFile,
  downloadFile,
} from "../../../src/core/export-import";

describe("importConfigJSON — edge cases", () => {
  it("rejects null watchlist entry", () => {
    const json = JSON.stringify({
      config: { theme: "dark", watchlist: [null] },
    });
    expect(() => importConfigJSON(json)).toThrow("Invalid watchlist entry");
  });

  it("rejects primitive watchlist entry", () => {
    const json = JSON.stringify({
      config: { theme: "dark", watchlist: [42] },
    });
    expect(() => importConfigJSON(json)).toThrow("Invalid watchlist entry");
  });

  it("rejects watchlist entry missing addedAt", () => {
    const json = JSON.stringify({
      config: { theme: "dark", watchlist: [{ ticker: "AAPL" }] },
    });
    expect(() => importConfigJSON(json)).toThrow("Invalid addedAt");
  });

  it("rejects non-object root payload", () => {
    expect(() => importConfigJSON('"just a string"')).toThrow("Invalid export format");
  });

  it("rejects number root payload", () => {
    expect(() => importConfigJSON("123")).toThrow("Invalid export format");
  });

  it("accepts high-contrast theme", () => {
    const json = JSON.stringify({
      config: {
        theme: "high-contrast",
        watchlist: [{ ticker: "AAPL", addedAt: "2025-01-01T00:00:00Z" }],
      },
    });
    const result = importConfigJSON(json);
    expect(result.theme).toBe("high-contrast");
  });

  it("accepts export without checksum (no verification)", () => {
    const json = JSON.stringify({
      schemaVersion: 1,
      config: {
        theme: "light",
        watchlist: [],
      },
    });
    const result = importConfigJSON(json);
    expect(result.theme).toBe("light");
  });
});

describe("downloadCompressedFile — with CompressionStream", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("compresses and downloads when CompressionStream is available", async () => {
    // Skip if CompressionStream is not available in the test env
    if (typeof CompressionStream === "undefined") {
      // Simulate CompressionStream
      const fakeStream = {
        getReader: () => ({
          read: vi
            .fn()
            .mockResolvedValueOnce({ done: false, value: new Uint8Array([1, 2, 3]) })
            .mockResolvedValueOnce({ done: true, value: undefined }),
        }),
      };

      // @ts-expect-error — stubbing global
      globalThis.CompressionStream = class {
        readable = fakeStream;
      };

      // Stub Response.body.pipeThrough
      vi.spyOn(globalThis, "Response").mockImplementation(
        () =>
          ({
            body: { pipeThrough: () => fakeStream },
          }) as unknown as Response,
      );
    }

    const clickSpy = vi.fn();
    const mockAnchor = {
      href: "",
      download: "",
      click: clickSpy,
    } as unknown as HTMLAnchorElement;
    vi.spyOn(document, "createElement").mockReturnValue(mockAnchor);
    vi.spyOn(document.body, "appendChild").mockImplementation(() => mockAnchor);
    vi.spyOn(document.body, "removeChild").mockImplementation(() => mockAnchor);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:compressed");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);

    await downloadCompressedFile("test content", "data.json.gz", "application/json");

    expect(clickSpy).toHaveBeenCalledOnce();
    expect(mockAnchor.download).toBe("data.json.gz");
  });
});

describe("downloadFile — additional coverage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("revokes the object URL after click", () => {
    const mockAnchor = {
      href: "",
      download: "",
      click: vi.fn(),
    } as unknown as HTMLAnchorElement;
    vi.spyOn(document, "createElement").mockReturnValue(mockAnchor);
    vi.spyOn(document.body, "appendChild").mockImplementation(() => mockAnchor);
    vi.spyOn(document.body, "removeChild").mockImplementation(() => mockAnchor);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);

    downloadFile("data", "test.json", "application/json");

    expect(revokeSpy).toHaveBeenCalledWith("blob:test");
  });
});
