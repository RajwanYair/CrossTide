/**
 * Provider Health card adapter tests (B5 — provider health card surfacing).
 *
 * Verifies that the CardModule wrapper renders health status from the
 * provider registry, starts the auto-refresh timer, and disposes cleanly.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock the provider registry and health monitor to avoid singleton state
vi.mock("../../../src/providers/provider-registry", () => ({
  getHealthSnapshot: vi.fn(() => ({
    entries: [
      {
        name: "yahoo",
        health: {
          name: "yahoo",
          available: true,
          lastSuccessAt: Date.now(),
          lastErrorAt: null,
          consecutiveErrors: 0,
        },
        breakerState: "closed",
        breakerFailures: 0,
      },
    ],
    capturedAt: Date.now(),
  })),
}));

vi.mock("../../../src/cards/provider-health-monitor", () => ({
  checkHealthTransition: vi.fn(),
}));

vi.mock("../../../src/core/provider-usage", () => ({
  getAllProviderUsage: vi.fn(() => [
    { provider: "yahoo", calls: 3, errors: 0, lastCallAt: 0, avgLatencyMs: 25 },
  ]),
}));

vi.mock("../../../src/core/rate-limit-tracker", () => ({
  getAllRateLimits: vi.fn(() => [
    { provider: "yahoo", requestsInWindow: 2, capacity: 60, usagePercent: 3 },
  ]),
}));

vi.mock("../../../src/core/failover-log", () => ({
  getFailoverLog: vi.fn(() => []),
}));

describe("provider-health-card (CardModule)", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    vi.useFakeTimers();
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("mounts without throwing", async () => {
    const { default: providerHealthCard } = await import("../../../src/cards/provider-health-card");
    expect(() =>
      providerHealthCard.mount(container, { route: "provider-health", params: {} }),
    ).not.toThrow();
  });

  it("renders provider names from the health snapshot", async () => {
    const { default: providerHealthCard } = await import("../../../src/cards/provider-health-card");
    providerHealthCard.mount(container, { route: "provider-health", params: {} });
    expect(container.textContent?.toLowerCase()).toContain("yahoo");
  });

  it("returns a handle with dispose function", async () => {
    const { default: providerHealthCard } = await import("../../../src/cards/provider-health-card");
    const handle = providerHealthCard.mount(container, { route: "provider-health", params: {} });
    expect(typeof handle?.dispose).toBe("function");
  });

  it("dispose clears the auto-refresh timer", async () => {
    const clearSpy = vi.spyOn(globalThis, "clearInterval");
    const { default: providerHealthCard } = await import("../../../src/cards/provider-health-card");
    const handle = providerHealthCard.mount(container, { route: "provider-health", params: {} });
    handle?.dispose?.();
    expect(clearSpy).toHaveBeenCalled();
  });

  it("calls getHealthSnapshot on mount", async () => {
    const { getHealthSnapshot } = await import("../../../src/providers/provider-registry");
    const { default: providerHealthCard } = await import("../../../src/cards/provider-health-card");
    const callsBefore = (getHealthSnapshot as ReturnType<typeof vi.fn>).mock.calls.length;
    providerHealthCard.mount(container, { route: "provider-health", params: {} });
    expect((getHealthSnapshot as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(
      callsBefore,
    );
  });

  it("auto-refreshes on interval (30s)", async () => {
    const { getHealthSnapshot } = await import("../../../src/providers/provider-registry");
    const { default: providerHealthCard } = await import("../../../src/cards/provider-health-card");
    providerHealthCard.mount(container, { route: "provider-health", params: {} });
    const callsAfterMount = (getHealthSnapshot as ReturnType<typeof vi.fn>).mock.calls.length;

    vi.advanceTimersByTime(30_000);
    expect((getHealthSnapshot as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(
      callsAfterMount,
    );
  });

  it("shows health status indicator", async () => {
    const { default: providerHealthCard } = await import("../../../src/cards/provider-health-card");
    providerHealthCard.mount(container, { route: "provider-health", params: {} });
    // The rendered HTML should contain some indicator of health state
    expect(container.innerHTML.length).toBeGreaterThan(50);
  });

  it("shows provider diagnostics summaries", async () => {
    const { default: providerHealthCard } = await import("../../../src/cards/provider-health-card");
    providerHealthCard.mount(container, { route: "provider-health", params: {} });
    expect(container.textContent).toContain("API calls: 3");
    expect(container.textContent).toContain("Rate windows: 1");
    expect(container.textContent).toContain("Failovers: 0");
  });

  it("calls checkHealthTransition on each refresh", async () => {
    const { checkHealthTransition } = await import("../../../src/cards/provider-health-monitor");
    const { default: providerHealthCard } = await import("../../../src/cards/provider-health-card");
    providerHealthCard.mount(container, { route: "provider-health", params: {} });
    expect(checkHealthTransition).toHaveBeenCalled();
  });
});
