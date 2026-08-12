/** Tests for the Worker news envelope route. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleNews } from "../../../worker/routes/news";

vi.mock("../../../worker/providers/finnhub.js", () => ({
  fetchFinnhubNews: vi.fn(),
  FinnhubApiError: class FinnhubApiError extends Error {
    readonly status: number;

    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
}));

import { fetchFinnhubNews } from "../../../worker/providers/finnhub.js";

const mockKvStore = {
  get: vi.fn(),
  put: vi.fn(),
};

function makeEnv(): Parameters<typeof handleNews>[1] {
  return { QUOTE_CACHE: mockKvStore, FINNHUB_KEY: "test-key" } as Parameters<typeof handleNews>[1];
}

const article = {
  id: 1,
  headline: "Apple reports strong earnings",
  summary: "Revenue increased.",
  source: "Example News",
  url: "https://example.com/article",
  datetime: 1_700_000_000,
  category: "company",
  image: "https://example.com/image.png",
};

describe("handleNews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockKvStore.get.mockResolvedValue(null);
    mockKvStore.put.mockResolvedValue(undefined);
    vi.mocked(fetchFinnhubNews).mockResolvedValue([article]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a live news envelope", async () => {
    const res = await handleNews(new URL("https://example.com/api/news?ticker=AAPL"), makeEnv());
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      schemaVersion: string;
      kind: string;
      status: string;
      data: { ticker: string; articles: unknown[]; source: string };
      provenance: { source: string; timezone: string; coverage: string; limitations: string[] };
    };
    expect(body.schemaVersion).toBe("1");
    expect(body.kind).toBe("news");
    expect(body.status).toBe("live");
    expect(body.data.ticker).toBe("AAPL");
    expect(body.data.articles).toHaveLength(1);
    expect(body.provenance.source).toBe("finnhub");
    expect(body.provenance.timezone).toBe("UTC");
    expect(body.provenance.coverage).toBe("Company news within the requested date range");
    expect(body.provenance.limitations).toContain(
      "Headline coverage and publication timestamps depend on the provider",
    );
  });

  it("returns cached news as a cached envelope", async () => {
    mockKvStore.get.mockResolvedValue(
      JSON.stringify({ ticker: "AAPL", articles: [], source: "finnhub" }),
    );
    const res = await handleNews(new URL("https://example.com/api/news?ticker=AAPL"), makeEnv());
    const body = (await res.json()) as {
      status: string;
      data: { source: string };
      provenance: { source: string };
    };
    expect(body.status).toBe("cached");
    expect(body.data.source).toBe("cache");
    expect(body.provenance.source).toBe("cache");
    expect(fetchFinnhubNews).not.toHaveBeenCalled();
  });
});
