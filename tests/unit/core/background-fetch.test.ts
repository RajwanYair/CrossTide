/**
 * Unit tests for the Background Fetch API wrapper (H7).
 *
 * The Background Fetch API is a browser-specific API not available in Node /
 * happy-dom, so we mock globalThis.BackgroundFetchManager and
 * navigator.serviceWorker to exercise the module logic without a real browser.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  backgroundFetchSupported,
  startArchiveDownload,
  getActiveFetches,
  onFetchProgress,
  fetchWithFallback,
} from "../../../src/core/background-fetch";
import type { FetchProgress } from "../../../src/core/background-fetch";

// ── Helpers / mocks ───────────────────────────────────────────────────────

function makeFakeRegistration(
  overrides: Partial<BackgroundFetchRegistration> = {},
): BackgroundFetchRegistration {
  const listeners: Map<string, EventListenerOrEventListenerObject[]> = new Map();
  return {
    id: "test-reg",
    downloaded: 512,
    downloadTotal: 1024,
    result: "success",
    failureReason: "",
    recordsAvailable: true,
    activeFetches: undefined,
    addEventListener: vi.fn((type: string, handler: EventListenerOrEventListenerObject) => {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type)!.push(handler);
    }),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onprogress: null,
    match: vi.fn(),
    matchAll: vi.fn(),
    abort: vi.fn(),
    ...overrides,
  } as unknown as BackgroundFetchRegistration;
}

function makeBgFetchManager(reg: BackgroundFetchRegistration | undefined = undefined): {
  fetch: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  getIds: ReturnType<typeof vi.fn>;
} {
  return {
    fetch: vi.fn().mockResolvedValue(reg ?? makeFakeRegistration()),
    get: vi.fn().mockResolvedValue(undefined), // no existing by default
    getIds: vi.fn().mockResolvedValue(["test-reg"]),
  };
}

function setupBgFetch(bgFetch: ReturnType<typeof makeBgFetchManager>): void {
  const swReg = { backgroundFetch: bgFetch };
  const swReady = Promise.resolve(swReg);
  const fakeServiceWorker = { ready: swReady };
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: fakeServiceWorker,
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe("backgroundFetchSupported", () => {
  afterEach(() => {
    delete (globalThis as any).BackgroundFetchManager;
  });

  it("returns false when BackgroundFetchManager is not in globalThis", () => {
    expect(backgroundFetchSupported()).toBe(false);
  });

  it("returns true when BackgroundFetchManager is present", () => {
    (globalThis as any).BackgroundFetchManager = class {};
    // happy-dom doesn't expose navigator.serviceWorker; stub it for the check
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {},
    });
    expect(backgroundFetchSupported()).toBe(true);
    // cleanup
    Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: undefined });
  });
});

describe("startArchiveDownload", () => {
  beforeEach(() => {
    (globalThis as any).BackgroundFetchManager = class {};
  });

  afterEach(() => {
    delete (globalThis as any).BackgroundFetchManager;
    vi.restoreAllMocks();
  });

  it("returns null when background fetch is not supported", async () => {
    delete (globalThis as any).BackgroundFetchManager;
    const result = await startArchiveDownload("https://example.com/archive.csv", {
      title: "Test download",
    });
    expect(result).toBeNull();
  });

  it("calls bgFetch.fetch with the URL and options", async () => {
    const bgFetch = makeBgFetchManager();
    setupBgFetch(bgFetch);
    const result = await startArchiveDownload("https://example.com/archive.csv", {
      title: "OHLCV Archive",
      registrationId: "my-archive",
    });
    expect(bgFetch.fetch).toHaveBeenCalledWith(
      "my-archive",
      ["https://example.com/archive.csv"],
      expect.objectContaining({ title: "OHLCV Archive" }),
    );
    expect(result).toBeDefined();
  });

  it("returns existing registration without re-fetching", async () => {
    const existing = makeFakeRegistration({ id: "existing-reg" });
    const bgFetch = makeBgFetchManager();
    bgFetch.get.mockResolvedValue(existing);
    setupBgFetch(bgFetch);
    const result = await startArchiveDownload("https://example.com/archive.csv", {
      title: "OHLCV Archive",
      registrationId: "existing-reg",
    });
    expect(bgFetch.fetch).not.toHaveBeenCalled();
    expect(result).toBe(existing);
  });
});

describe("getActiveFetches", () => {
  afterEach(() => {
    delete (globalThis as any).BackgroundFetchManager;
    vi.restoreAllMocks();
  });

  it("returns empty array when unsupported", async () => {
    expect(await getActiveFetches()).toEqual([]);
  });

  it("returns registrations for each active ID", async () => {
    (globalThis as any).BackgroundFetchManager = class {};
    const reg = makeFakeRegistration();
    const bgFetch = makeBgFetchManager(reg);
    bgFetch.get.mockResolvedValue(reg);
    setupBgFetch(bgFetch);
    const result = await getActiveFetches();
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(reg);
  });
});

describe("onFetchProgress", () => {
  it("calls callback immediately with current state", () => {
    const reg = makeFakeRegistration({ downloaded: 256, downloadTotal: 1024 });
    const cb = vi.fn();
    onFetchProgress(reg, cb);
    expect(cb).toHaveBeenCalledOnce();
    const progress = cb.mock.calls[0]![0] as FetchProgress;
    expect(progress.downloaded).toBe(256);
    expect(progress.downloadTotal).toBe(1024);
    expect(progress.ratio).toBeCloseTo(0.25);
  });

  it("returns a cleanup function that removes the listener", () => {
    const reg = makeFakeRegistration();
    const cb = vi.fn();
    const cleanup = onFetchProgress(reg, cb);
    cleanup();
    expect(reg.removeEventListener).toHaveBeenCalledWith("progress", expect.any(Function));
  });

  it("reports ratio=-1 when downloadTotal is 0", () => {
    const reg = makeFakeRegistration({ downloaded: 0, downloadTotal: 0 });
    const cb = vi.fn();
    onFetchProgress(reg, cb);
    const progress = cb.mock.calls[0]![0] as FetchProgress;
    expect(progress.ratio).toBe(-1);
  });
});

describe("fetchWithFallback", () => {
  const mockGlobalFetch = vi.fn();

  beforeEach(() => {
    mockGlobalFetch.mockReset();
    vi.stubGlobal("fetch", mockGlobalFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();

    delete (globalThis as any).BackgroundFetchManager;
    vi.restoreAllMocks();
  });

  it("uses standard fetch when preferBackground is false", async () => {
    mockGlobalFetch.mockResolvedValueOnce(
      new Response("data", { status: 200, headers: { "Content-Length": "4" } }),
    );
    const res = await fetchWithFallback("https://example.com/data.csv", {
      preferBackground: false,
    });
    expect(res).not.toBeNull();
    expect(mockGlobalFetch).toHaveBeenCalledWith(
      "https://example.com/data.csv",
      expect.any(Object),
    );
  });

  it("falls back to standard fetch when Background Fetch is unsupported", async () => {
    mockGlobalFetch.mockResolvedValueOnce(new Response("ok", { status: 200 }));
    const res = await fetchWithFallback("https://example.com/data.csv", {
      preferBackground: true,
    });
    expect(res).not.toBeNull();
    expect(mockGlobalFetch).toHaveBeenCalled();
  });

  it("returns null and uses Background Fetch when supported + preferBackground=true", async () => {
    (globalThis as any).BackgroundFetchManager = class {};
    const bgFetch = makeBgFetchManager();
    setupBgFetch(bgFetch);
    const res = await fetchWithFallback("https://example.com/archive.csv", {
      preferBackground: true,
      backgroundTitle: "OHLCV Download",
    });
    expect(res).toBeNull();
    expect(mockGlobalFetch).not.toHaveBeenCalled();
    expect(bgFetch.fetch).toHaveBeenCalled();
  });
});
