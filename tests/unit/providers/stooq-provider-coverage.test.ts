/**
 * Coverage for stooq-provider.ts — index symbol mapping (line 38),
 * pass-through for dotted tickers, fetch error path (line 106), and
 * CSV edge cases (lines 51-75).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createStooqProvider } from "../../../src/providers/stooq-provider";
import type { MarketDataProvider } from "../../../src/providers/types";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function textResponse(body: string, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    json: async () => JSON.parse(body),
    text: async () => body,
    headers: new Headers(),
    redirected: false,
    type: "basic",
    url: "",
    body: null,
    bodyUsed: false,
    clone: () => textResponse(body, status),
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob(),
    formData: async () => new FormData(),
    bytes: async () => new Uint8Array(),
  } as Response;
}

const SAMPLE_CSV = `Date,Open,High,Low,Close,Volume
2025-05-02,194.5,197.0,193.2,196.0,52000000
2025-05-01,192.0,195.1,191.5,194.5,48000000
`;

describe("stooq-provider coverage", () => {
  let provider: MarketDataProvider;

  beforeEach(() => {
    mockFetch.mockReset();
    provider = createStooqProvider("https://mock.stooq");
  });

  it("maps index ticker ^DJI → dji (strips caret, no suffix) (line 38)", async () => {
    mockFetch.mockResolvedValueOnce(textResponse(SAMPLE_CSV));
    await provider.getHistory("^DJI", 365);
    const calledUrl = mockFetch.mock.calls[0]?.[0] as string;
    expect(calledUrl).toContain("dji");
    expect(calledUrl).not.toContain(".us");
    expect(calledUrl).not.toContain(".v");
  });

  it("passes through ticker already containing a dot (line 31)", async () => {
    mockFetch.mockResolvedValueOnce(textResponse(SAMPLE_CSV));
    await provider.getHistory("CDR.WA", 365);
    const calledUrl = mockFetch.mock.calls[0]?.[0] as string;
    expect(calledUrl).toContain("cdr.wa");
  });

  it("maps known crypto SOL → sol.v (line 33)", async () => {
    mockFetch.mockResolvedValueOnce(textResponse(SAMPLE_CSV));
    await provider.getHistory("SOL", 365);
    const calledUrl = mockFetch.mock.calls[0]?.[0] as string;
    expect(calledUrl).toContain("sol.v");
  });

  it("throws and records error when fetch rejects (line 106)", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network failure"));
    await expect(provider.getHistory("AAPL", 365)).rejects.toThrow("network failure");
    expect(provider.health().consecutiveErrors).toBe(1);
  });

  it("parseCsv throws for empty body (no header) (line 51)", async () => {
    mockFetch.mockResolvedValueOnce(textResponse(""));
    await expect(provider.getHistory("AAPL", 365)).rejects.toThrow();
  });

  it("parseCsv throws for unexpected header (line 53)", async () => {
    mockFetch.mockResolvedValueOnce(textResponse("Unexpected,Header\n1,2\n"));
    await expect(provider.getHistory("AAPL", 365)).rejects.toThrow("unexpected CSV header");
  });

  it("parseCsv skips rows with fewer than 5 columns (line 60)", async () => {
    const csv = `Date,Open,High,Low,Close,Volume
2025-05-02,194.5,197.0,193.2,196.0,52000000
2025-05-01,192.0,195.1
`;
    mockFetch.mockResolvedValueOnce(textResponse(csv));
    const candles = await provider.getHistory("AAPL", 365);
    // Only 1 valid row
    expect(candles).toHaveLength(1);
  });

  it("parseCsv skips rows with NaN values (line 66)", async () => {
    const csv = `Date,Open,High,Low,Close,Volume
2025-05-02,abc,197.0,193.2,196.0,52000000
2025-05-01,192.0,195.1,191.5,194.5,48000000
`;
    mockFetch.mockResolvedValueOnce(textResponse(csv));
    const candles = await provider.getHistory("AAPL", 365);
    expect(candles).toHaveLength(1);
    expect(candles[0]!.close).toBe(194.5);
  });

  it("parseCsv handles missing volume gracefully (line 70)", async () => {
    const csv = `Date,Open,High,Low,Close
2025-05-02,194.5,197.0,193.2,196.0
`;
    mockFetch.mockResolvedValueOnce(textResponse(csv));
    const candles = await provider.getHistory("AAPL", 365);
    expect(candles).toHaveLength(1);
    expect(candles[0]!.volume).toBe(0);
  });
});
