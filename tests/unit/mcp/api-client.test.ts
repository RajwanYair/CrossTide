/**
 * Guards the MCP API client's optional bearer-token auth (roadmap E04).
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { authHeaders, callApi, postApi } from "../../../mcp-server/src/api-client.js";

describe("authHeaders", () => {
  const originalToken = process.env.CROSSTIDE_API_TOKEN;

  afterEach(() => {
    if (originalToken === undefined) delete process.env.CROSSTIDE_API_TOKEN;
    else process.env.CROSSTIDE_API_TOKEN = originalToken;
  });

  it("returns no Authorization header when CROSSTIDE_API_TOKEN is unset", () => {
    delete process.env.CROSSTIDE_API_TOKEN;
    expect(authHeaders()).toEqual({});
  });

  it("returns a Bearer Authorization header when CROSSTIDE_API_TOKEN is set", () => {
    process.env.CROSSTIDE_API_TOKEN = "secret-token";
    expect(authHeaders()).toEqual({ Authorization: "Bearer secret-token" });
  });
});

describe("callApi / postApi", () => {
  const originalToken = process.env.CROSSTIDE_API_TOKEN;
  const originalBase = process.env.CROSSTIDE_API_URL;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (originalToken === undefined) delete process.env.CROSSTIDE_API_TOKEN;
    else process.env.CROSSTIDE_API_TOKEN = originalToken;
    if (originalBase === undefined) delete process.env.CROSSTIDE_API_URL;
    else process.env.CROSSTIDE_API_URL = originalBase;
  });

  it("forwards the bearer token on GET requests", async () => {
    process.env.CROSSTIDE_API_TOKEN = "secret-token";
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true })));

    await callApi("/api/quote/AAPL");

    const headers = fetchSpy.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer secret-token");
  });

  it("forwards the bearer token on POST requests", async () => {
    process.env.CROSSTIDE_API_TOKEN = "secret-token";
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true })));

    await postApi("/api/screener", { tickers: ["AAPL"] });

    const headers = fetchSpy.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer secret-token");
  });

  it("omits Authorization when no token is configured", async () => {
    delete process.env.CROSSTIDE_API_TOKEN;
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true })));

    await callApi("/api/quote/AAPL");

    const headers = fetchSpy.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it("throws with response body on non-ok status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("upstream down", { status: 502 }),
    );
    await expect(callApi("/api/quote/AAPL")).rejects.toThrow(/502/u);
  });
});
