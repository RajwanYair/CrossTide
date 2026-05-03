/**
 * Unit tests for fundamental-overlay rendering.
 */
import { describe, it, expect } from "vitest";
import { renderFundamentalsOverlay } from "../../src/cards/fundamental-overlay";
import type { FundamentalData } from "../../src/types/domain";

describe("renderFundamentalsOverlay", () => {
  it("returns empty string for null data", () => {
    expect(renderFundamentalsOverlay(null)).toBe("");
  });

  it("returns empty string when all fields are undefined", () => {
    const data: FundamentalData = { fetchedAt: "2025-01-01T00:00:00Z" };
    expect(renderFundamentalsOverlay(data)).toBe("");
  });

  it("renders P/E ratio", () => {
    const data: FundamentalData = { peRatio: 25.3, fetchedAt: "2025-01-01T00:00:00Z" };
    const html = renderFundamentalsOverlay(data);
    expect(html).toContain("P/E");
    expect(html).toContain("25.30");
  });

  it("renders market cap with abbreviation", () => {
    const data: FundamentalData = {
      marketCap: 2_800_000_000_000,
      fetchedAt: "2025-01-01T00:00:00Z",
    };
    const html = renderFundamentalsOverlay(data);
    expect(html).toContain("Mkt Cap");
    expect(html).toContain("2.80T");
  });

  it("renders revenue in billions", () => {
    const data: FundamentalData = { revenue: 394_000_000_000, fetchedAt: "2025-01-01T00:00:00Z" };
    const html = renderFundamentalsOverlay(data);
    expect(html).toContain("Revenue");
    expect(html).toContain("394.00B");
  });

  it("renders dividend yield as percentage", () => {
    const data: FundamentalData = { dividendYield: 0.035, fetchedAt: "2025-01-01T00:00:00Z" };
    const html = renderFundamentalsOverlay(data);
    expect(html).toContain("Div Yield");
    expect(html).toContain("3.50%");
  });

  it("renders all metrics together", () => {
    const data: FundamentalData = {
      peRatio: 25.3,
      forwardPe: 22.1,
      eps: 6.57,
      revenue: 394_000_000_000,
      marketCap: 2_800_000_000_000,
      dividendYield: 0.005,
      priceToBook: 3.5,
      debtToEquity: 180.5,
      returnOnEquity: 0.35,
      profitMargin: 0.21,
      fetchedAt: "2025-01-01T00:00:00Z",
    };
    const html = renderFundamentalsOverlay(data);
    expect(html).toContain("fundamental-overlay");
    expect(html).toContain("aria-label");
    expect(html).toContain("P/E");
    expect(html).toContain("Fwd P/E");
    expect(html).toContain("EPS");
    expect(html).toContain("Mkt Cap");
    expect(html).toContain("Revenue");
    expect(html).toContain("Div Yield");
    expect(html).toContain("P/B");
    expect(html).toContain("D/E");
    expect(html).toContain("ROE");
    expect(html).toContain("Margin");
  });

  it("formats millions correctly", () => {
    const data: FundamentalData = { revenue: 5_200_000, fetchedAt: "2025-01-01T00:00:00Z" };
    const html = renderFundamentalsOverlay(data);
    expect(html).toContain("5.20M");
  });

  it("formats thousands correctly", () => {
    const data: FundamentalData = { revenue: 8500, fetchedAt: "2025-01-01T00:00:00Z" };
    const html = renderFundamentalsOverlay(data);
    expect(html).toContain("8.5K");
  });

  it("wraps in a section with aria-label", () => {
    const data: FundamentalData = { peRatio: 15, fetchedAt: "2025-01-01T00:00:00Z" };
    const html = renderFundamentalsOverlay(data);
    expect(html).toMatch(/<section class="fundamental-overlay" aria-label="Fundamental data">/);
  });
});
