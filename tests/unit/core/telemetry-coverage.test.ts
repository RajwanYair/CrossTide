/**
 * Telemetry coverage boost — targets uncovered lines:
 *   155  — installErrorBoundary() without handler (analytics-only path)
 *   166  — web vitals callback body (analytics.event("web_vital", …))
 *   178-181 — destroy() teardown sequence
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import type { TelemetryHandle } from "../../../src/core/telemetry";

const mockEvent = vi.fn();
const mockPageview = vi.fn();
const mockSetEnabled = vi.fn();
const mockStop = vi.fn();
const mockTeardown = vi.fn();
let errorBoundaryHandler: ((record: unknown) => void) | undefined;

vi.mock("../../../src/core/analytics-client", () => ({
  createAnalyticsClient: vi.fn().mockReturnValue({
    event: mockEvent,
    pageview: mockPageview,
    setEnabled: mockSetEnabled,
  }),
}));

vi.mock("../../../src/core/error-boundary", () => ({
  installErrorBoundary: vi.fn().mockImplementation((handler?: (r: unknown) => void) => {
    errorBoundaryHandler = handler;
    return mockTeardown;
  }),
}));

let vitalsCallback: ((report: { name: string; value: number }) => void) | undefined;
vi.mock("../../../src/core/web-vitals", () => ({
  observeWebVitals: vi
    .fn()
    .mockImplementation((cb: (r: { name: string; value: number }) => void) => {
      vitalsCallback = cb;
      return { stop: mockStop };
    }),
}));

async function loadTelemetry(
  plausibleUrl = "",
  plausibleSite = "",
  glitchtipDsn = "",
): Promise<{
  initTelemetry: () => TelemetryHandle;
  _resetTelemetryForTests: () => void;
}> {
  if (plausibleUrl) vi.stubGlobal("__PLAUSIBLE_URL__", plausibleUrl);
  if (plausibleSite) vi.stubGlobal("__PLAUSIBLE_SITE__", plausibleSite);
  if (glitchtipDsn) vi.stubGlobal("__GLITCHTIP_DSN__", glitchtipDsn);
  vi.resetModules();
  return import("../../../src/core/telemetry") as Promise<{
    initTelemetry: () => TelemetryHandle;
    _resetTelemetryForTests: () => void;
  }>;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  mockEvent.mockClear();
  mockPageview.mockClear();
  mockSetEnabled.mockClear();
  mockStop.mockClear();
  mockTeardown.mockClear();
  errorBoundaryHandler = undefined;
  vitalsCallback = undefined;
});

describe("telemetry — analytics-only path (no GlitchTip)", () => {
  it("calls installErrorBoundary without handler (line 155)", async () => {
    const { installErrorBoundary } = await import("../../../src/core/error-boundary");
    const { initTelemetry, _resetTelemetryForTests } = await loadTelemetry(
      "https://plausible.io",
      "test.site",
      "", // no glitchtip
    );
    _resetTelemetryForTests();
    initTelemetry();
    // Should be called without a handler function (i.e., zero arguments)
    expect(installErrorBoundary).toHaveBeenCalled();
    expect(errorBoundaryHandler).toBeUndefined();
  });
});

describe("telemetry — web vitals callback (line 166)", () => {
  it("forwards web vital reports to analytics with rounded value", async () => {
    const { initTelemetry, _resetTelemetryForTests } = await loadTelemetry(
      "https://plausible.io",
      "test.site",
    );
    _resetTelemetryForTests();
    initTelemetry();

    expect(vitalsCallback).toBeDefined();
    vitalsCallback!({ name: "LCP", value: 1234.56 });

    expect(mockEvent).toHaveBeenCalledWith("web_vital", {
      name: "LCP",
      value: 1235,
    });
  });
});

describe("telemetry — destroy teardown (lines 178-181)", () => {
  it("calls teardownErrors and vitalsObserver.stop on destroy", async () => {
    const { initTelemetry, _resetTelemetryForTests } = await loadTelemetry(
      "https://plausible.io",
      "test.site",
      "https://key@glitchtip.example.com/1",
    );
    _resetTelemetryForTests();
    const handle = initTelemetry();

    handle.destroy();

    expect(mockTeardown).toHaveBeenCalledOnce();
    expect(mockStop).toHaveBeenCalledOnce();
  });

  it("handle.pageview delegates to analytics.pageview", async () => {
    const { initTelemetry, _resetTelemetryForTests } = await loadTelemetry(
      "https://plausible.io",
      "test.site",
    );
    _resetTelemetryForTests();
    const handle = initTelemetry();

    handle.pageview("/dashboard");
    expect(mockPageview).toHaveBeenCalledWith("/dashboard");
  });

  it("handle.setEnabled delegates to analytics.setEnabled", async () => {
    const { initTelemetry, _resetTelemetryForTests } = await loadTelemetry(
      "https://plausible.io",
      "test.site",
    );
    _resetTelemetryForTests();
    const handle = initTelemetry();

    handle.setEnabled(false);
    expect(mockSetEnabled).toHaveBeenCalledWith(false);
  });
});
