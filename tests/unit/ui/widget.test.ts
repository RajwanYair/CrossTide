import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CrosstideChartElement,
  CrosstideConsensusElement,
  CrosstideQuoteElement,
} from "../../../src/ui/widget.js";

// Register the element if not already
if (!customElements.get("crosstide-chart")) {
  customElements.define("crosstide-chart", CrosstideChartElement);
}
if (!customElements.get("crosstide-quote")) {
  customElements.define("crosstide-quote", CrosstideQuoteElement);
}
if (!customElements.get("crosstide-consensus")) {
  customElements.define("crosstide-consensus", CrosstideConsensusElement);
}

describe("CrosstideChartElement", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should be a custom element", () => {
    expect(customElements.get("crosstide-chart")).toBe(CrosstideChartElement);
  });

  it("registers quote and consensus elements", () => {
    expect(customElements.get("crosstide-quote")).toBe(CrosstideQuoteElement);
    expect(customElements.get("crosstide-consensus")).toBe(CrosstideConsensusElement);
  });

  it("should observe the correct attributes", () => {
    expect(CrosstideChartElement.observedAttributes).toEqual([
      "ticker",
      "interval",
      "range",
      "theme",
      "height",
      "show-volume",
      "api-base",
    ]);
  });

  it("should render a loading state on connect", () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ candles: [] }), { status: 200 }),
    );

    const el = document.createElement("crosstide-chart") as CrosstideChartElement;
    el.setAttribute("ticker", "MSFT");
    document.body.appendChild(el);

    expect(el.style.height).toBe("300px");

    vi.restoreAllMocks();
  });

  it("should respect custom height attribute", () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ candles: [] }), { status: 200 }),
    );

    const el = document.createElement("crosstide-chart") as CrosstideChartElement;
    el.setAttribute("height", "500");
    document.body.appendChild(el);

    expect(el.style.height).toBe("500px");

    vi.restoreAllMocks();
  });

  it("should show error on fetch failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("Not Found", { status: 404 }));

    const el = document.createElement("crosstide-chart") as CrosstideChartElement;
    el.setAttribute("ticker", "INVALID");
    document.body.appendChild(el);

    await new Promise((r) => setTimeout(r, 50));

    expect(el.isConnected).toBe(true);

    vi.restoreAllMocks();
  });

  it("should abort fetch on disconnect", () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(
      () =>
        new Promise(() => {
          /* never resolves */
        }),
    );

    const el = document.createElement("crosstide-chart") as CrosstideChartElement;
    document.body.appendChild(el);
    document.body.removeChild(el);

    expect(el.isConnected).toBe(false);

    vi.restoreAllMocks();
  });

  it("should default ticker to AAPL", () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      expect(url).toContain("ticker=AAPL");
      expect(url).toContain("/api/chart?");
      expect(url).toContain("range=3mo");
      expect(url).toContain("interval=1d");
      expect(url).toStartWith("https://worker.crosstide.pages.dev/");
      return new Response(JSON.stringify({ candles: [] }), { status: 200 });
    });

    const el = document.createElement("crosstide-chart") as CrosstideChartElement;
    document.body.appendChild(el);

    vi.restoreAllMocks();
  });

  it("should respect custom range and api base attributes", () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      expect(url).toContain("range=1y");
      expect(url).toContain("ticker=NVDA");
      expect(url).toStartWith("https://example.test/api/chart");
      return new Response(JSON.stringify({ candles: [] }), { status: 200 });
    });

    const el = document.createElement("crosstide-chart") as CrosstideChartElement;
    el.setAttribute("ticker", "NVDA");
    el.setAttribute("range", "1y");
    el.setAttribute("api-base", "https://example.test/");
    document.body.appendChild(el);

    vi.restoreAllMocks();
  });

  it("quote widget fetches /api/quote/:symbol", async () => {
    let requestedUrl = "";
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      requestedUrl = typeof input === "string" ? input : (input as Request).url;
      return new Response(
        JSON.stringify({
          ticker: "MSFT",
          price: 420.12,
          change: 2.34,
          changePercent: 0.56,
          currency: "USD",
        }),
        { status: 200 },
      );
    });

    const el = document.createElement("crosstide-quote") as CrosstideQuoteElement;
    el.setAttribute("ticker", "MSFT");
    el.setAttribute("api-base", "https://example.test/");
    document.body.appendChild(el);

    await Promise.resolve();
    await Promise.resolve();

    expect(requestedUrl).toBe("https://example.test/api/quote/MSFT");
    vi.restoreAllMocks();
  });

  it("consensus widget posts to /api/screener", async () => {
    let method = "";
    let url = "";
    let body = "";

    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      url = typeof input === "string" ? input : (input as Request).url;
      method = init?.method ?? "GET";
      body = typeof init?.body === "string" ? init.body : "";

      return new Response(
        JSON.stringify({ rows: [{ ticker: "AAPL", consensus: "BUY", score: 87 }] }),
        {
          status: 200,
        },
      );
    });

    const el = document.createElement("crosstide-consensus") as CrosstideConsensusElement;
    el.setAttribute("ticker", "aapl");
    el.setAttribute("api-base", "https://worker.example");
    document.body.appendChild(el);

    await Promise.resolve();
    await Promise.resolve();

    expect(url).toBe("https://worker.example/api/screener");
    expect(method).toBe("POST");
    expect(JSON.parse(body)).toEqual({ tickers: ["AAPL"] });
    vi.restoreAllMocks();
  });

  it("quote and consensus observed attributes stay explicit", () => {
    expect(CrosstideQuoteElement.observedAttributes).toEqual([
      "ticker",
      "theme",
      "api-base",
      "show-change",
    ]);
    expect(CrosstideConsensusElement.observedAttributes).toEqual(["ticker", "theme", "api-base"]);
  });
});
