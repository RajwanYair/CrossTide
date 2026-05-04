/**
 * Freshness indicator tests.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { updateFreshnessIndicator } from "../../../src/ui/freshness-indicator";
import { markFetched, resetFreshness } from "../../../src/core/data-freshness";

describe("updateFreshnessIndicator", () => {
  beforeEach(() => {
    document.body.innerHTML = '<span id="data-freshness"></span>';
    resetFreshness();
  });

  it("shows empty when no tickers tracked", () => {
    updateFreshnessIndicator();
    const el = document.getElementById("data-freshness")!;
    expect(el.textContent).toBe("");
    expect(el.className).toBe("");
  });

  it("shows Live when all data is fresh", () => {
    markFetched("AAPL");
    markFetched("MSFT");
    updateFreshnessIndicator();
    const el = document.getElementById("data-freshness")!;
    expect(el.textContent).toBe("Live");
    expect(el.className).toContain("freshness-fresh");
  });

  it("shows stale indicator when data is old", () => {
    const fiveMinAgo = Date.now() - 6 * 60 * 1000;
    markFetched("AAPL", fiveMinAgo);
    markFetched("MSFT"); // fresh
    updateFreshnessIndicator();
    const el = document.getElementById("data-freshness")!;
    expect(el.className).toContain("freshness-stale");
    expect(el.textContent).toContain("m ago");
  });

  it("shows expired indicator when data is very old", () => {
    const hourAgo = Date.now() - 60 * 60 * 1000;
    markFetched("AAPL", hourAgo);
    updateFreshnessIndicator();
    const el = document.getElementById("data-freshness")!;
    expect(el.className).toContain("freshness-expired");
    expect(el.textContent).toContain("h ago");
  });

  it("does nothing if element missing", () => {
    document.body.innerHTML = "";
    expect(() => updateFreshnessIndicator()).not.toThrow();
  });
});
