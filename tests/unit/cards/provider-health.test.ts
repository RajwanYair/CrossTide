/**
 * Provider health card tests.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  computeHealthSummary,
  formatRelativeTime,
  renderProviderHealth,
  type ProviderHealthSnapshot,
} from "../../../src/cards/provider-health";
import type { ProviderHealth } from "../../../src/providers/types";

const NOW = 1_700_000_000_000;

const PROVIDERS: ProviderHealth[] = [
  {
    name: "Yahoo Finance",
    available: true,
    lastSuccessAt: NOW - 30_000,
    lastErrorAt: null,
    consecutiveErrors: 0,
  },
  {
    name: "Twelve Data",
    available: true,
    lastSuccessAt: NOW - 120_000,
    lastErrorAt: NOW - 600_000,
    consecutiveErrors: 0,
  },
  {
    name: "Polygon",
    available: false,
    lastSuccessAt: NOW - 7_200_000,
    lastErrorAt: NOW - 10_000,
    consecutiveErrors: 5,
  },
];

describe("computeHealthSummary", () => {
  it("all healthy", () => {
    const s = computeHealthSummary({ providers: PROVIDERS.slice(0, 2), lastRefreshAt: NOW });
    expect(s.availableCount).toBe(2);
    expect(s.degraded).toBe(false);
    expect(s.allDown).toBe(false);
  });

  it("degraded when some down", () => {
    const s = computeHealthSummary({ providers: PROVIDERS, lastRefreshAt: NOW });
    expect(s.availableCount).toBe(2);
    expect(s.degraded).toBe(true);
    expect(s.allDown).toBe(false);
  });

  it("all down", () => {
    const all: ProviderHealth[] = [
      { name: "A", available: false, lastSuccessAt: null, lastErrorAt: NOW, consecutiveErrors: 10 },
    ];
    const s = computeHealthSummary({ providers: all, lastRefreshAt: NOW });
    expect(s.allDown).toBe(true);
    expect(s.degraded).toBe(false);
  });

  it("empty providers", () => {
    const s = computeHealthSummary({ providers: [], lastRefreshAt: NOW });
    expect(s.totalProviders).toBe(0);
    expect(s.allDown).toBe(false);
  });
});

describe("formatRelativeTime", () => {
  it("returns 'never' for null", () => {
    expect(formatRelativeTime(null, NOW)).toBe("never");
  });

  it("returns 'just now' for <60s", () => {
    expect(formatRelativeTime(NOW - 30_000, NOW)).toBe("just now");
  });

  it("returns minutes", () => {
    expect(formatRelativeTime(NOW - 300_000, NOW)).toBe("5m ago");
  });

  it("returns hours", () => {
    expect(formatRelativeTime(NOW - 7_200_000, NOW)).toBe("2h ago");
  });

  it("returns days", () => {
    expect(formatRelativeTime(NOW - 172_800_000, NOW)).toBe("2d ago");
  });
});

describe("renderProviderHealth", () => {
  let container: HTMLElement;
  beforeEach(() => {
    container = document.createElement("div");
  });

  it("renders a row per provider", () => {
    renderProviderHealth(container, { providers: PROVIDERS, lastRefreshAt: NOW });
    const rows = container.querySelectorAll("tbody tr");
    expect(rows.length).toBe(3);
  });

  it("shows empty state for no providers", () => {
    renderProviderHealth(container, { providers: [], lastRefreshAt: NOW });
    expect(container.textContent).toContain("No providers configured");
  });

  it("shows Degraded badge when partially down", () => {
    renderProviderHealth(container, { providers: PROVIDERS, lastRefreshAt: NOW });
    expect(container.textContent).toContain("Degraded");
    expect(container.textContent).toContain("2/3 available");
  });

  it("shows Healthy badge when all up", () => {
    renderProviderHealth(container, { providers: PROVIDERS.slice(0, 2), lastRefreshAt: NOW });
    expect(container.textContent).toContain("Healthy");
  });

  it("shows All Down badge when none available", () => {
    const down: ProviderHealth[] = [
      { name: "X", available: false, lastSuccessAt: null, lastErrorAt: NOW, consecutiveErrors: 3 },
    ];
    renderProviderHealth(container, { providers: down, lastRefreshAt: NOW });
    expect(container.textContent).toContain("All Down");
  });

  it("escapes provider names", () => {
    const xss: ProviderHealth[] = [
      {
        name: "<script>",
        available: true,
        lastSuccessAt: NOW,
        lastErrorAt: null,
        consecutiveErrors: 0,
      },
    ];
    renderProviderHealth(container, { providers: xss, lastRefreshAt: NOW });
    expect(container.innerHTML).not.toContain("<script>");
    expect(container.innerHTML).toContain("&lt;script&gt;");
  });
});
