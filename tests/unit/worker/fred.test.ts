/**
 * Q6 — Unit tests for the FRED economic data overlay route.
 *
 * Uses mocked fetch to verify: series resolution, CSV parsing, caching,
 * error handling, and validation of both aliases and canonical IDs.
 *
 * No network calls are made.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleFred } from "../../../worker/routes/fred.js";
import type { Env } from "../../../worker/index.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeUrl(params: Record<string, string>): URL {
  const u = new URL("https://worker.example.com/api/fred");
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  return u;
}

const kvStore = new Map<string, unknown>();

const mockEnv: Env = {
  QUOTE_CACHE: {
    get: vi.fn(async (key: string, type: "text" | "json") => {
      const val = kvStore.get(key);
      if (val === undefined) return null;
      if (type === "json") return val;
      return JSON.stringify(val);
    }) as unknown as KVNamespace["get"],
    put: vi.fn(async (key: string, value: string) => {
      kvStore.set(key, JSON.parse(value));
    }) as unknown as KVNamespace["put"],
    delete: vi.fn() as unknown as KVNamespace["delete"],
  } as unknown as Env["QUOTE_CACHE"],
};

// Minimal KVNamespace interface mock type (mirrors worker/index.ts)
interface KVNamespace {
  get(key: string, type: "text"): Promise<string | null>;
  get(key: string, type: "json"): Promise<unknown>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

const SAMPLE_CSV = `DATE,VALUE
2024-01-01,15.23
2024-01-02,.
2024-01-03,16.01
`;

beforeEach(() => {
  kvStore.clear();
  vi.stubGlobal("fetch", vi.fn());
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ── Series resolution tests ───────────────────────────────────────────────────

describe("handleFred — series resolution", () => {
  it("accepts lowercase alias 'vix' → VIXCLS", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(SAMPLE_CSV, { status: 200 })),
    );
    const res = await handleFred(makeUrl({ series: "vix" }), mockEnv);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { series: string };
    expect(json.series).toBe("VIXCLS");
  });

  it("accepts uppercase canonical ID 'VIXCLS' directly", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(SAMPLE_CSV, { status: 200 })),
    );
    const res = await handleFred(makeUrl({ series: "VIXCLS" }), mockEnv);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { series: string };
    expect(json.series).toBe("VIXCLS");
  });

  it("accepts '10y' alias → DGS10", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(SAMPLE_CSV, { status: 200 })),
    );
    const res = await handleFred(makeUrl({ series: "10y" }), mockEnv);
    const json = (await res.json()) as { series: string };
    expect(json.series).toBe("DGS10");
  });

  it("accepts 'fedfunds' alias → FEDFUNDS", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(SAMPLE_CSV, { status: 200 })),
    );
    const res = await handleFred(makeUrl({ series: "fedfunds" }), mockEnv);
    const json = (await res.json()) as { series: string };
    expect(json.series).toBe("FEDFUNDS");
  });

  it("returns 400 for unknown series", async () => {
    const res = await handleFred(makeUrl({ series: "UNKNOWN_XYZ" }), mockEnv);
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: string; supported: string[] };
    expect(json.error).toContain("Unknown series");
    expect(Array.isArray(json.supported)).toBe(true);
  });

  it("returns 400 when 'series' param is missing", async () => {
    const res = await handleFred(makeUrl({}), mockEnv);
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).toContain("Missing or invalid");
  });

  it("returns 400 when series param exceeds 20 chars", async () => {
    const res = await handleFred(makeUrl({ series: "A".repeat(21) }), mockEnv);
    expect(res.status).toBe(400);
  });
});

// ── CSV parsing tests ─────────────────────────────────────────────────────────

describe("handleFred — CSV parsing", () => {
  it("parses numeric values from CSV", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(SAMPLE_CSV, { status: 200 })),
    );
    const res = await handleFred(makeUrl({ series: "vix" }), mockEnv);
    const json = (await res.json()) as { observations: { date: string; value: number | null }[] };
    expect(json.observations).toHaveLength(3);
    expect(json.observations[0]).toMatchObject({ date: "2024-01-01", value: 15.23 });
  });

  it("represents FRED '.' (missing) as null", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(SAMPLE_CSV, { status: 200 })),
    );
    const res = await handleFred(makeUrl({ series: "vix" }), mockEnv);
    const json = (await res.json()) as { observations: { date: string; value: number | null }[] };
    expect(json.observations[1]).toMatchObject({ date: "2024-01-02", value: null });
  });

  it("includes label in response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(SAMPLE_CSV, { status: 200 })),
    );
    const res = await handleFred(makeUrl({ series: "vix" }), mockEnv);
    const json = (await res.json()) as { label: string };
    expect(json.label).toBe("CBOE Volatility Index (VIX)");
  });

  it("returns source 'fred' on fresh fetch", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(SAMPLE_CSV, { status: 200 })),
    );
    const res = await handleFred(makeUrl({ series: "vix" }), mockEnv);
    const json = (await res.json()) as { source: string };
    expect(json.source).toBe("fred");
  });
});

// ── KV caching tests ──────────────────────────────────────────────────────────

describe("handleFred — KV caching", () => {
  it("stores result in KV after fresh fetch", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(SAMPLE_CSV, { status: 200 })),
    );
    await handleFred(makeUrl({ series: "vix" }), mockEnv);
    expect(mockEnv.QUOTE_CACHE?.put).toHaveBeenCalledOnce();
  });

  it("returns source 'cache' on cache hit", async () => {
    // Pre-populate the KV store
    kvStore.set("fred:VIXCLS", {
      series: "VIXCLS",
      label: "CBOE Volatility Index (VIX)",
      observations: [{ date: "2024-01-01", value: 15.23 }],
      source: "fred",
    });
    const res = await handleFred(makeUrl({ series: "vix" }), mockEnv);
    const json = (await res.json()) as { source: string };
    expect(json.source).toBe("cache");
  });

  it("does not call fetch on cache hit", async () => {
    kvStore.set("fred:VIXCLS", {
      series: "VIXCLS",
      label: "CBOE Volatility Index (VIX)",
      observations: [],
      source: "fred",
    });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await handleFred(makeUrl({ series: "vix" }), mockEnv);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

// ── Error handling tests ──────────────────────────────────────────────────────

describe("handleFred — error handling", () => {
  it("returns 502 when FRED upstream returns non-OK status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("Not Found", { status: 404 })),
    );
    const res = await handleFred(makeUrl({ series: "vix" }), mockEnv);
    expect(res.status).toBe(502);
    const json = (await res.json()) as { error: string };
    expect(json.error).toContain("FRED upstream error");
  });

  it("returns 502 when network fetch throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("Network failure");
      }),
    );
    const res = await handleFred(makeUrl({ series: "vix" }), mockEnv);
    expect(res.status).toBe(502);
    const json = (await res.json()) as { error: string };
    expect(json.error).toContain("Failed to reach FRED API");
  });

  it("works without QUOTE_CACHE binding (no-cache environment)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(SAMPLE_CSV, { status: 200 })),
    );
    const envNoCfCache: Env = {};
    const res = await handleFred(makeUrl({ series: "vix" }), envNoCfCache);
    expect(res.status).toBe(200);
  });
});
