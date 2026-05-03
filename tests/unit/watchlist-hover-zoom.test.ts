/**
 * L11: Watchlist hover zoom unit tests.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { bindHoverZoom, setHoverQuotes } from "../../src/ui/watchlist-hover-zoom";
import type { WatchlistQuote } from "../../src/ui/watchlist";

function makeQuote(ticker: string): WatchlistQuote {
  return {
    ticker,
    price: 150.25,
    change: 2.5,
    changePercent: 1.69,
    volume: 1_200_000,
    avgVolume: 1_000_000,
    high52w: 180,
    low52w: 120,
    closes30d: Array.from({ length: 30 }, (_, i) => 140 + i * 0.5),
    consensus: { direction: "BUY", strength: 0.75, ticker, buyMethods: [], sellMethods: [] },
    name: "Apple Inc.",
  };
}

describe("Watchlist hover zoom", () => {
  let tbody: HTMLElement;
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    document.body.innerHTML = "";
    tbody = document.createElement("tbody");
    tbody.innerHTML = `<tr data-ticker="AAPL"><td>AAPL</td></tr>
                       <tr data-ticker="MSFT"><td>MSFT</td></tr>`;
    document.body.appendChild(tbody);

    const quotes = new Map<string, WatchlistQuote>();
    quotes.set("AAPL", makeQuote("AAPL"));
    quotes.set("MSFT", makeQuote("MSFT"));
    setHoverQuotes(quotes);
  });

  afterEach(() => {
    cleanup?.();
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("creates popup element on bind", () => {
    cleanup = bindHoverZoom(tbody);
    const popup = document.getElementById("hover-zoom-popup");
    expect(popup).toBeTruthy();
    expect(popup?.getAttribute("role")).toBe("tooltip");
    expect(popup?.getAttribute("aria-hidden")).toBe("true");
  });

  it("shows popup after pointer enter with delay", async () => {
    vi.useFakeTimers();
    cleanup = bindHoverZoom(tbody);

    const row = tbody.querySelector("tr[data-ticker='AAPL']")!;
    row.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));

    // Not visible yet (delay not elapsed)
    const popup = document.getElementById("hover-zoom-popup")!;
    expect(popup.classList.contains("visible")).toBe(false);

    // Advance past show delay
    vi.advanceTimersByTime(350);
    expect(popup.classList.contains("visible")).toBe(true);
    expect(popup.innerHTML).toContain("AAPL");
    expect(popup.innerHTML).toContain("150.25");
    expect(popup.innerHTML).toContain("BUY");

    vi.useRealTimers();
  });

  it("hides popup after pointer leave with delay", async () => {
    vi.useFakeTimers();
    cleanup = bindHoverZoom(tbody);

    const row = tbody.querySelector("tr[data-ticker='AAPL']")!;
    row.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));
    vi.advanceTimersByTime(350);

    const popup = document.getElementById("hover-zoom-popup")!;
    expect(popup.classList.contains("visible")).toBe(true);

    row.dispatchEvent(new PointerEvent("pointerleave", { bubbles: true }));
    vi.advanceTimersByTime(200);
    expect(popup.classList.contains("visible")).toBe(false);

    vi.useRealTimers();
  });

  it("does not show popup if pointer leaves before delay", () => {
    vi.useFakeTimers();
    cleanup = bindHoverZoom(tbody);

    const row = tbody.querySelector("tr[data-ticker='AAPL']")!;
    row.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));
    vi.advanceTimersByTime(100); // less than 300ms

    row.dispatchEvent(new PointerEvent("pointerleave", { bubbles: true }));
    vi.advanceTimersByTime(500);

    const popup = document.getElementById("hover-zoom-popup")!;
    expect(popup.classList.contains("visible")).toBe(false);

    vi.useRealTimers();
  });

  it("switches popup between tickers", () => {
    vi.useFakeTimers();
    cleanup = bindHoverZoom(tbody);

    const rowAapl = tbody.querySelector("tr[data-ticker='AAPL']")!;
    const rowMsft = tbody.querySelector("tr[data-ticker='MSFT']")!;

    rowAapl.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));
    vi.advanceTimersByTime(350);

    const popup = document.getElementById("hover-zoom-popup")!;
    expect(popup.innerHTML).toContain("AAPL");

    rowAapl.dispatchEvent(new PointerEvent("pointerleave", { bubbles: true }));
    rowMsft.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));
    vi.advanceTimersByTime(350);

    expect(popup.innerHTML).toContain("MSFT");

    vi.useRealTimers();
  });

  it("renders sparkline SVG in popup", () => {
    vi.useFakeTimers();
    cleanup = bindHoverZoom(tbody);

    const row = tbody.querySelector("tr[data-ticker='AAPL']")!;
    row.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));
    vi.advanceTimersByTime(350);

    const popup = document.getElementById("hover-zoom-popup")!;
    expect(popup.innerHTML).toContain("<svg");
    expect(popup.innerHTML).toContain("hover-zoom-chart");

    vi.useRealTimers();
  });

  it("cleanup removes listeners and hides popup", () => {
    vi.useFakeTimers();
    cleanup = bindHoverZoom(tbody);

    const row = tbody.querySelector("tr[data-ticker='AAPL']")!;
    row.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));
    vi.advanceTimersByTime(350);

    const popup = document.getElementById("hover-zoom-popup")!;
    expect(popup.classList.contains("visible")).toBe(true);

    cleanup();
    cleanup = undefined;
    expect(popup.classList.contains("visible")).toBe(false);

    vi.useRealTimers();
  });

  it("handles missing quote gracefully", () => {
    vi.useFakeTimers();
    setHoverQuotes(new Map()); // empty quotes
    cleanup = bindHoverZoom(tbody);

    const row = tbody.querySelector("tr[data-ticker='AAPL']")!;
    row.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));
    vi.advanceTimersByTime(350);

    const popup = document.getElementById("hover-zoom-popup")!;
    // Should not show when no quote data
    expect(popup.classList.contains("visible")).toBe(false);

    vi.useRealTimers();
  });
});
