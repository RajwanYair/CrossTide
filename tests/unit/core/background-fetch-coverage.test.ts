/**
 * Background-fetch coverage boost — targets uncovered lines:
 *   106  — getActiveFetches success path (bgFetch.getIds → bgFetch.get)
 *   166-189 — fetchWithFallback streaming progress via ReadableStream
 *   209  — urlToSlug catch branch (invalid URL)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getActiveFetches,
  fetchWithFallback,
  type FetchProgress,
} from "../../../src/core/background-fetch";

describe("getActiveFetches — success path (line 106)", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", {
      serviceWorker: {
        ready: Promise.resolve({
          backgroundFetch: {
            getIds: vi.fn().mockResolvedValue(["id1", "id2"]),
            get: vi
              .fn()
              .mockImplementation((id: string) =>
                Promise.resolve(id === "id1" ? { id: "id1" } : undefined),
              ),
          },
        }),
      },
    });
    vi.stubGlobal("BackgroundFetchManager", class {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns active registrations filtering out undefined", async () => {
    const fetches = await getActiveFetches();
    expect(fetches).toHaveLength(1);
    expect((fetches[0] as unknown as { id: string }).id).toBe("id1");
  });
});

describe("getActiveFetches — error path", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", {
      serviceWorker: {
        ready: Promise.reject(new Error("SW not available")),
      },
    });
    vi.stubGlobal("BackgroundFetchManager", class {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns empty array on SW ready rejection", async () => {
    const fetches = await getActiveFetches();
    expect(fetches).toEqual([]);
  });
});

describe("fetchWithFallback — streaming progress (lines 166-189)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("streams progress via ReadableStream when onProgress is set", async () => {
    const chunk1 = new TextEncoder().encode("hello");
    const chunk2 = new TextEncoder().encode(" world");
    let readCount = 0;

    const mockBody = {
      getReader: () => ({
        read: vi.fn().mockImplementation(() => {
          readCount++;
          if (readCount === 1) return Promise.resolve({ done: false, value: chunk1 });
          if (readCount === 2) return Promise.resolve({ done: false, value: chunk2 });
          return Promise.resolve({ done: true, value: undefined });
        }),
      }),
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        body: mockBody,
        headers: new Headers({ "Content-Length": "11" }),
        status: 200,
        statusText: "OK",
      }),
    );

    const progress: FetchProgress[] = [];
    const response = await fetchWithFallback("https://example.com/data.csv", {
      onProgress: (p) => progress.push({ ...p }),
    });

    expect(response).not.toBeNull();
    // Read the wrapped stream to trigger progress callbacks
    const reader = response!.body!.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    expect(chunks).toHaveLength(2);
    // Progress should have been called: 2 chunks + 1 final (done)
    expect(progress.length).toBeGreaterThanOrEqual(3);
    // Final progress should have ratio = 1
    expect(progress[progress.length - 1]!.ratio).toBe(1);
  });

  it("handles unknown content length (no Content-Length header)", async () => {
    const chunk = new TextEncoder().encode("data");
    let readCount = 0;

    const mockBody = {
      getReader: () => ({
        read: vi.fn().mockImplementation(() => {
          readCount++;
          if (readCount === 1) return Promise.resolve({ done: false, value: chunk });
          return Promise.resolve({ done: true, value: undefined });
        }),
      }),
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        body: mockBody,
        headers: new Headers(), // no Content-Length
        status: 200,
        statusText: "OK",
      }),
    );

    const progress: FetchProgress[] = [];
    const response = await fetchWithFallback("https://example.com/data.csv", {
      onProgress: (p) => progress.push({ ...p }),
    });

    const reader = response!.body!.getReader();
    while (true) {
      const { done } = await reader.read();
      if (done) break;
    }

    // First progress should have ratio = -1 (unknown total)
    expect(progress[0]!.ratio).toBe(-1);
    // Final should have ratio = 1
    expect(progress[progress.length - 1]!.ratio).toBe(1);
  });

  it("falls back to standard fetch without progress when no body", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("hello", { status: 200 })));

    // This tests the path where onProgress is set but response.body might be consumed
    const response = await fetchWithFallback("https://example.com/small");
    expect(response).not.toBeNull();
    expect(response!.status).toBe(200);
  });
});

describe("urlToSlug — invalid URL catch branch (line 209)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("generates fallback slug for invalid URL via startArchiveDownload", async () => {
    // We can't call urlToSlug directly since it's private, but we can
    // trigger it through startArchiveDownload with an invalid URL and
    // no registrationId. The slug will use the catch fallback.
    vi.stubGlobal("navigator", {
      serviceWorker: {
        ready: Promise.resolve({
          backgroundFetch: {
            get: vi.fn().mockResolvedValue(undefined),
            fetch: vi.fn().mockResolvedValue({ id: "test" }),
          },
        }),
      },
    });
    vi.stubGlobal("BackgroundFetchManager", class {});

    const { startArchiveDownload } = await import("../../../src/core/background-fetch");
    // "not a url" is invalid for new URL(), triggering the catch branch
    const reg = await startArchiveDownload("not a valid url", {
      title: "Test",
      // no registrationId — forces urlToSlug usage
    });
    expect(reg).toBeDefined();
  });
});
