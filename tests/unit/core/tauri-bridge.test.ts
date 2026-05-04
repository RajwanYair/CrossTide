/**
 * Unit tests for Tauri integration helpers (H17).
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  isTauriEnv,
  getTauriInvoke,
  safeInvoke,
  setWindowTitle,
  resizeWindow,
  toggleFullscreen,
  setAlwaysOnTop,
  minimizeToTray,
  parseDeepLink,
  buildTrayActions,
  defaultWindowOptions,
} from "../../../src/core/tauri-bridge";

// ── Mock Tauri global ────────────────────────────────────────────────────

function installTauriMock(invokeFn: ReturnType<typeof vi.fn>): void {
  (globalThis as Record<string, unknown>).__TAURI__ = {
    core: { invoke: invokeFn },
  };
}

function removeTauriMock(): void {
  delete (globalThis as Record<string, unknown>).__TAURI__;
}

// ── isTauriEnv ───────────────────────────────────────────────────────────

describe("isTauriEnv", () => {
  afterEach(removeTauriMock);

  it("returns false in plain browser", () => {
    removeTauriMock();
    expect(isTauriEnv()).toBe(false);
  });

  it("returns true when __TAURI__ is present", () => {
    installTauriMock(vi.fn());
    expect(isTauriEnv()).toBe(true);
  });
});

// ── getTauriInvoke ───────────────────────────────────────────────────────

describe("getTauriInvoke", () => {
  afterEach(removeTauriMock);

  it("returns null when not in Tauri", () => {
    expect(getTauriInvoke()).toBeNull();
  });

  it("returns invoke function when available", () => {
    const mockInvoke = vi.fn();
    installTauriMock(mockInvoke);
    expect(getTauriInvoke()).toBe(mockInvoke);
  });
});

// ── safeInvoke ───────────────────────────────────────────────────────────

describe("safeInvoke", () => {
  afterEach(removeTauriMock);

  it("returns null when not in Tauri", async () => {
    expect(await safeInvoke("any_command")).toBeNull();
  });

  it("invokes command and returns result", async () => {
    const mockInvoke = vi.fn().mockResolvedValue("1.0.0");
    installTauriMock(mockInvoke);
    const result = await safeInvoke("get_app_version");
    expect(result).toBe("1.0.0");
    expect(mockInvoke).toHaveBeenCalledWith("get_app_version", undefined);
  });

  it("passes args to invoke", async () => {
    const mockInvoke = vi.fn().mockResolvedValue(null);
    installTauriMock(mockInvoke);
    await safeInvoke("cmd", { key: "value" });
    expect(mockInvoke).toHaveBeenCalledWith("cmd", { key: "value" });
  });
});

// ── Window management ────────────────────────────────────────────────────

describe("setWindowTitle", () => {
  afterEach(removeTauriMock);

  it("returns false when not in Tauri", async () => {
    expect(await setWindowTitle("Test")).toBe(false);
  });

  it("returns true when invoked successfully", async () => {
    installTauriMock(vi.fn().mockResolvedValue("ok"));
    expect(await setWindowTitle("CrossTide")).toBe(true);
  });
});

describe("resizeWindow", () => {
  afterEach(removeTauriMock);

  it("returns false when not in Tauri", async () => {
    expect(await resizeWindow(800, 600)).toBe(false);
  });

  it("passes dimensions to invoke", async () => {
    const mock = vi.fn().mockResolvedValue("ok");
    installTauriMock(mock);
    await resizeWindow(1024, 768);
    expect(mock).toHaveBeenCalledWith("resize_window", { width: 1024, height: 768 });
  });
});

describe("toggleFullscreen", () => {
  afterEach(removeTauriMock);

  it("returns false when not in Tauri", async () => {
    expect(await toggleFullscreen()).toBe(false);
  });
});

describe("setAlwaysOnTop", () => {
  afterEach(removeTauriMock);

  it("passes value to invoke", async () => {
    const mock = vi.fn().mockResolvedValue("ok");
    installTauriMock(mock);
    await setAlwaysOnTop(true);
    expect(mock).toHaveBeenCalledWith("set_always_on_top", { value: true });
  });
});

describe("minimizeToTray", () => {
  afterEach(removeTauriMock);

  it("returns false when not in Tauri", async () => {
    expect(await minimizeToTray()).toBe(false);
  });
});

// ── parseDeepLink ────────────────────────────────────────────────────────

describe("parseDeepLink", () => {
  it("parses crosstide:// deep link", () => {
    const result = parseDeepLink("crosstide://watchlist?tickers=AAPL,MSFT");
    expect(result).not.toBeNull();
    expect(result!.path).toBe("watchlist");
    expect(result!.query.tickers).toBe("AAPL,MSFT");
  });

  it("handles empty path", () => {
    const result = parseDeepLink("crosstide://");
    expect(result).not.toBeNull();
    expect(result!.path).toBe("");
  });

  it("handles multiple query params", () => {
    const result = parseDeepLink("crosstide://share?id=abc&mode=view");
    expect(result!.query).toEqual({ id: "abc", mode: "view" });
  });

  it("returns null for non-crosstide protocol", () => {
    expect(parseDeepLink("https://example.com")).toBeNull();
  });

  it("returns null for invalid URL", () => {
    expect(parseDeepLink("not-a-url")).toBeNull();
  });
});

// ── buildTrayActions ─────────────────────────────────────────────────────

describe("buildTrayActions", () => {
  it("builds default tray actions", () => {
    const actions = buildTrayActions();
    expect(actions.length).toBeGreaterThanOrEqual(4);
    expect(actions[0].id).toBe("show");
    expect(actions[actions.length - 1].id).toBe("quit");
  });

  it("includes always-on-top when requested", () => {
    const actions = buildTrayActions({ includeAlwaysOnTop: true });
    expect(actions.some((a) => a.id === "pin")).toBe(true);
  });

  it("excludes always-on-top by default", () => {
    const actions = buildTrayActions();
    expect(actions.some((a) => a.id === "pin")).toBe(false);
  });
});

// ── defaultWindowOptions ─────────────────────────────────────────────────

describe("defaultWindowOptions", () => {
  it("returns sensible defaults", () => {
    const opts = defaultWindowOptions();
    expect(opts.width).toBe(1280);
    expect(opts.height).toBe(800);
    expect(opts.resizable).toBe(true);
    expect(opts.fullscreen).toBe(false);
    expect(opts.title).toBe("CrossTide");
  });
});
