/**
 * Fetch utilities tests.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchWithTimeout, fetchWithRetry, FetchError } from "../../../src/core/fetch";

describe("fetchWithTimeout", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns response for successful fetch", async () => {
    const mockResponse = new Response("ok", { status: 200 });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    const result = await fetchWithTimeout("https://example.com");
    expect(result.ok).toBe(true);
  });

  it("throws FetchError for non-ok status", async () => {
    const mockResponse = new Response("", { status: 404, statusText: "Not Found" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    await expect(fetchWithTimeout("https://example.com")).rejects.toThrow(FetchError);
  });

  it("throws on abort signal", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((_url: string, opts: RequestInit) => {
        return new Promise((_resolve, reject) => {
          opts.signal?.addEventListener("abort", () => {
            reject(new DOMException("The operation was aborted.", "AbortError"));
          });
        });
      }),
    );

    await expect(fetchWithTimeout("https://example.com", {}, 50)).rejects.toThrow();
  });
});

describe("fetchWithRetry", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns on first success", async () => {
    const mockResponse = new Response("ok", { status: 200 });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    const result = await fetchWithRetry("https://example.com", {}, 3, 1);
    expect(result.ok).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("retries on failure then succeeds", async () => {
    const ok = new Response("ok", { status: 200 });
    const fail = new Response("", { status: 500, statusText: "Error" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(fail).mockResolvedValueOnce(fail).mockResolvedValueOnce(ok),
    );

    const result = await fetchWithRetry("https://example.com", {}, 3, 1);
    expect(result.ok).toBe(true);
  });

  it("throws after exhausting retries", async () => {
    const fail = new Response("", { status: 500, statusText: "Error" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(fail));

    await expect(fetchWithRetry("https://example.com", {}, 1, 1)).rejects.toThrow();
  });
});

describe("FetchError", () => {
  it("has name and status", () => {
    const err = new FetchError("not found", 404);
    expect(err.name).toBe("FetchError");
    expect(err.status).toBe(404);
    expect(err.message).toBe("not found");
  });
});
