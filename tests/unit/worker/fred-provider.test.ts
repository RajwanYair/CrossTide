import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchFredSeries,
  parseFredCsv,
  resolveSeriesId,
  seriesLabel,
  supportedAliases,
  FredApiError,
} from "../../../worker/providers/fred";

describe("resolveSeriesId", () => {
  it("maps aliases to canonical IDs", () => {
    expect(resolveSeriesId("vix")).toBe("VIXCLS");
    expect(resolveSeriesId("10y")).toBe("DGS10");
    expect(resolveSeriesId("fedfunds")).toBe("FEDFUNDS");
  });

  it("accepts direct canonical IDs", () => {
    expect(resolveSeriesId("VIXCLS")).toBe("VIXCLS");
    expect(resolveSeriesId("DGS10")).toBe("DGS10");
  });

  it("returns null for invalid IDs", () => {
    expect(resolveSeriesId("!!!")).toBeNull();
    expect(resolveSeriesId("")).toBeNull();
  });
});

describe("seriesLabel", () => {
  it("returns label for known series", () => {
    expect(seriesLabel("VIXCLS")).toContain("VIX");
  });

  it("falls back to series ID for unknown", () => {
    expect(seriesLabel("CUSTOM123")).toBe("CUSTOM123");
  });
});

describe("supportedAliases", () => {
  it("returns non-empty list of aliases", () => {
    const aliases = supportedAliases();
    expect(aliases.length).toBeGreaterThan(5);
    expect(aliases).toContain("vix");
    expect(aliases).toContain("10y");
  });
});

describe("parseFredCsv", () => {
  it("parses valid CSV data", () => {
    const csv = "DATE,VALUE\n2024-01-01,15.5\n2024-01-02,16.0\n";
    const result = parseFredCsv(csv);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ date: "2024-01-01", value: 15.5 });
    expect(result[1]).toEqual({ date: "2024-01-02", value: 16.0 });
  });

  it("handles missing values (dot notation)", () => {
    const csv = "DATE,VALUE\n2024-01-01,.\n2024-01-02,16.0\n";
    const result = parseFredCsv(csv);
    expect(result).toHaveLength(2);
    expect(result[0]?.value).toBeNull();
    expect(result[1]?.value).toBe(16.0);
  });

  it("skips malformed lines", () => {
    const csv = "DATE,VALUE\nbadline\n2024-01-01,15.5\n";
    const result = parseFredCsv(csv);
    expect(result).toHaveLength(1);
  });

  it("returns empty array for header-only CSV", () => {
    const csv = "DATE,VALUE\n";
    const result = parseFredCsv(csv);
    expect(result).toHaveLength(0);
  });
});

describe("fetchFredSeries", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses JSON API when key is provided", async () => {
    const apiResponse = {
      observations: [
        { date: "2024-01-01", value: "15.5" },
        { date: "2024-01-02", value: "16.0" },
      ],
    };
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(apiResponse), { status: 200 }));
    const result = await fetchFredSeries("VIXCLS", "test-key");
    expect(result.series).toBe("VIXCLS");
    expect(result.observations).toHaveLength(2);
    expect(result.source).toBe("fred");
    const calledUrl = String(vi.mocked(fetch).mock.calls[0]?.[0]);
    expect(calledUrl).toContain("api_key=test-key");
  });

  it("uses CSV endpoint when no key provided", async () => {
    const csv = "DATE,VALUE\n2024-01-01,15.5\n2024-01-02,16.0\n";
    vi.mocked(fetch).mockResolvedValue(new Response(csv, { status: 200 }));
    const result = await fetchFredSeries("VIXCLS");
    expect(result.series).toBe("VIXCLS");
    expect(result.observations).toHaveLength(2);
    const calledUrl = String(vi.mocked(fetch).mock.calls[0]?.[0]);
    expect(calledUrl).toContain("fredgraph.csv");
  });

  it("throws on upstream error", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("error", { status: 500 }));
    await expect(fetchFredSeries("VIXCLS", "key")).rejects.toThrow(FredApiError);
  });

  it("handles missing values in API response", async () => {
    const apiResponse = {
      observations: [
        { date: "2024-01-01", value: "." },
        { date: "2024-01-02", value: "16.0" },
      ],
    };
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(apiResponse), { status: 200 }));
    const result = await fetchFredSeries("VIXCLS", "key");
    expect(result.observations[0]?.value).toBeNull();
    expect(result.observations[1]?.value).toBe(16.0);
  });

  it("includes label in result", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ observations: [] }), { status: 200 }),
    );
    const result = await fetchFredSeries("VIXCLS", "key");
    expect(result.label).toContain("VIX");
  });
});
