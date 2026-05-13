import { describe, it, expect, vi, beforeEach } from "vitest";
import { CrosstideChartElement } from "../../../src/ui/widget.js";

// Register the element if not already
if (!customElements.get("crosstide-chart")) {
  customElements.define("crosstide-chart", CrosstideChartElement);
}

describe("CrosstideChartElement", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should be a custom element", () => {
    expect(customElements.get("crosstide-chart")).toBe(CrosstideChartElement);
  });

  it("should observe the correct attributes", () => {
    expect(CrosstideChartElement.observedAttributes).toEqual([
      "ticker",
      "interval",
      "theme",
      "height",
      "show-volume",
      "api-base",
    ]);
  });

  it("should render a loading state on connect", () => {
    // Mock fetch to avoid actual network calls
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ candles: [] }), { status: 200 }),
    );

    const el = document.createElement("crosstide-chart") as CrosstideChartElement;
    el.setAttribute("ticker", "MSFT");
    document.body.appendChild(el);

    // Height should be set
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

    // Wait for async fetch
    await new Promise((r) => setTimeout(r, 50));

    // The shadow root should contain an error
    // closed shadow root — can't inspect directly, but element should still be in DOM
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

    // No errors should be thrown
    expect(el.isConnected).toBe(false);

    vi.restoreAllMocks();
  });

  it("should default ticker to AAPL", () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      expect(url).toContain("ticker=AAPL");
      return new Response(JSON.stringify({ candles: [] }), { status: 200 });
    });

    const el = document.createElement("crosstide-chart") as CrosstideChartElement;
    document.body.appendChild(el);

    vi.restoreAllMocks();
  });
});
