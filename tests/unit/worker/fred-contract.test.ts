/**
 * Contract tests for FRED worker provider (Q25).
 *
 * Validates that the provider correctly handles responses matching
 * the real FRED API schema — catches schema drift when the upstream
 * API changes response structure or field names.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchFredSeries,
  parseFredCsv,
  resolveSeriesId,
  seriesLabel,
  supportedAliases,
  FredApiError,
} from "../../../worker/providers/fred";
import type { FredSeriesResult, FredObservation } from "../../../worker/providers/fred";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

// ── Realistic API response fixtures ───────────────────────────────────────────

/** Matches real FRED JSON API /fred/series/observations response. */
const FRED_JSON_FIXTURE = {
  realtime_start: "2024-01-01",
  realtime_end: "2024-12-31",
  observation_start: "2023-01-01",
  observation_end: "2024-05-15",
  units: "lin",
  output_type: 1,
  file_type: "json",
  order_by: "observation_date",
  sort_order: "asc",
  count: 5,
  offset: 0,
  limit: 100000,
  observations: [
    { date: "2024-05-10", value: "13.10" },
    { date: "2024-05-13", value: "12.55" },
    { date: "2024-05-14", value: "12.82" },
    { date: "2024-05-15", value: "." },
    { date: "2024-05-16", value: "11.99" },
  ],
};

/** Matches real FRED CSV response format. */
const FRED_CSV_FIXTURE = `DATE,VIXCLS
2024-05-10,13.10
2024-05-13,12.55
2024-05-14,12.82
2024-05-15,.
2024-05-16,11.99
`;

function ok(body: unknown, contentType = "application/json"): Response {
  return new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": contentType },
  });
}

function errorResponse(status: number): Response {
  return new Response("error", { status });
}

// ── Series resolution contract ────────────────────────────────────────────────

describe("FRED series resolution contract", () => {
  it("resolves known aliases to canonical FRED IDs", () => {
    expect(resolveSeriesId("vix")).toBe("VIXCLS");
    expect(resolveSeriesId("10y")).toBe("DGS10");
    expect(resolveSeriesId("2y")).toBe("DGS2");
    expect(resolveSeriesId("fedfunds")).toBe("FEDFUNDS");
  });

  it("resolves canonical IDs as-is (uppercase)", () => {
    expect(resolveSeriesId("VIXCLS")).toBe("VIXCLS");
    expect(resolveSeriesId("DGS10")).toBe("DGS10");
  });

  it("returns null for unknown series", () => {
    expect(resolveSeriesId("NONEXISTENT_SERIES_XYZ")).toBeNull();
  });

  it("provides labels for known series", () => {
    const label = seriesLabel("VIXCLS");
    expect(label).toContain("VIX");
    expect(typeof label).toBe("string");
    expect(label.length).toBeGreaterThan(0);
  });

  it("exposes supported aliases list", () => {
    const aliases = supportedAliases();
    expect(aliases.length).toBeGreaterThan(5);
    expect(aliases).toContain("vix");
    expect(aliases).toContain("10y");
  });
});

// ── CSV parsing contract ──────────────────────────────────────────────────────

describe("FRED CSV parsing contract", () => {
  it("parses standard FRED CSV with DATE header", () => {
    const observations: FredObservation[] = parseFredCsv(FRED_CSV_FIXTURE);

    expect(observations).toHaveLength(5);

    // First observation
    expect(observations[0]!.date).toBe("2024-05-10");
    expect(observations[0]!.value).toBe(13.1);

    // Missing value represented as "."
    const missing = observations[3]!;
    expect(missing.date).toBe("2024-05-15");
    expect(missing.value).toBeNull();
  });

  it("handles empty CSV (header only)", () => {
    const observations = parseFredCsv("DATE,VALUE\n");
    expect(observations).toHaveLength(0);
  });

  it("handles CRLF line endings", () => {
    const csv = "DATE,VIXCLS\r\n2024-01-01,15.5\r\n2024-01-02,16.0\r\n";
    const observations = parseFredCsv(csv);
    expect(observations).toHaveLength(2);
  });
});

// ── JSON API fetch contract ───────────────────────────────────────────────────

describe("FRED JSON API fetch contract", () => {
  it("parses real API response shape with API key", async () => {
    mockFetch.mockResolvedValueOnce(ok(FRED_JSON_FIXTURE));

    const result: FredSeriesResult = await fetchFredSeries("VIXCLS", "test-api-key");

    expect(result.series).toBe("VIXCLS");
    expect(result.source).toBe("fred");
    expect(typeof result.label).toBe("string");
    expect(result.observations.length).toBeGreaterThan(0);

    // Verify observation shape
    const obs = result.observations[0]!;
    expect(typeof obs.date).toBe("string");
    expect(obs.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(typeof obs.value).toBe("number");

    // Verify missing value handling (the "." entry)
    const missingObs = result.observations.find((o) => o.date === "2024-05-15");
    expect(missingObs?.value).toBeNull();
  });

  it("constructs correct API URL with key", async () => {
    mockFetch.mockResolvedValueOnce(ok(FRED_JSON_FIXTURE));

    await fetchFredSeries("DGS10", "my-key-123");

    const calledUrl = mockFetch.mock.calls[0]?.[0] as string;
    expect(calledUrl).toContain("series_id=DGS10");
    expect(calledUrl).toContain("api_key=my-key-123");
    expect(calledUrl).toContain("file_type=json");
  });

  it("throws FredApiError on API failure", async () => {
    mockFetch.mockResolvedValueOnce(errorResponse(403));

    await expect(fetchFredSeries("VIXCLS", "bad-key")).rejects.toThrow(FredApiError);
  });

  it("throws FredApiError on 429 rate limit", async () => {
    mockFetch.mockResolvedValueOnce(errorResponse(429));

    try {
      await fetchFredSeries("VIXCLS", "key");
    } catch (err) {
      expect(err).toBeInstanceOf(FredApiError);
      expect((err as FredApiError).status).toBe(429);
    }
  });
});

// ── CSV fallback fetch contract ───────────────────────────────────────────────

describe("FRED CSV fallback fetch contract", () => {
  it("fetches via CSV when no API key provided", async () => {
    mockFetch.mockResolvedValueOnce(ok(FRED_CSV_FIXTURE, "text/csv"));

    const result: FredSeriesResult = await fetchFredSeries("VIXCLS");

    expect(result.series).toBe("VIXCLS");
    expect(result.source).toBe("fred");
    expect(result.observations.length).toBeGreaterThan(0);

    // Verify the URL used the CSV endpoint
    const calledUrl = mockFetch.mock.calls[0]?.[0] as string;
    expect(calledUrl).toContain("fredgraph.csv");
    expect(calledUrl).not.toContain("api_key");
  });

  it("handles empty CSV gracefully", async () => {
    mockFetch.mockResolvedValueOnce(ok("DATE,VALUE\n", "text/csv"));

    const result = await fetchFredSeries("VIXCLS");
    expect(result.observations).toHaveLength(0);
  });
});
