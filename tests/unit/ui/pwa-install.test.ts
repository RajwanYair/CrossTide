/**
 * PWA install manager tests (C8).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createPwaInstallManager, getPwaInstallManager } from "../../../src/ui/pwa-install";

function storageMock(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    key(i: number) {
      return [...store.keys()][i] ?? null;
    },
    getItem(k: string) {
      return store.get(k) ?? null;
    },
    setItem(k: string, v: string) {
      store.set(k, v);
    },
    removeItem(k: string) {
      store.delete(k);
    },
    clear() {
      store.clear();
    },
  };
}

describe("createPwaInstallManager", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", storageMock());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("isAvailable() returns false before beforeinstallprompt fires", () => {
    const mgr = createPwaInstallManager();
    expect(mgr.isAvailable()).toBe(false);
    mgr.destroy();
  });

  it("isAvailable() returns true after beforeinstallprompt fires", () => {
    const mgr = createPwaInstallManager();
    const event = new Event("beforeinstallprompt");
    Object.defineProperty(event, "preventDefault", { value: vi.fn(), writable: true });
    window.dispatchEvent(event);
    expect(mgr.isAvailable()).toBe(true);
    mgr.destroy();
  });

  it("onReady callback is called when prompt fires and not dismissed", () => {
    const cb = vi.fn();
    const mgr = createPwaInstallManager();
    mgr.onReady(cb);
    const event = new Event("beforeinstallprompt");
    Object.defineProperty(event, "preventDefault", { value: vi.fn(), writable: true });
    window.dispatchEvent(event);
    expect(cb).toHaveBeenCalledOnce();
    mgr.destroy();
  });

  it("onReady callback is NOT called when previously dismissed", () => {
    localStorage.setItem("crosstide-pwa-install-dismissed", "1");
    const cb = vi.fn();
    const mgr = createPwaInstallManager();
    mgr.onReady(cb);
    const event = new Event("beforeinstallprompt");
    Object.defineProperty(event, "preventDefault", { value: vi.fn(), writable: true });
    window.dispatchEvent(event);
    expect(cb).not.toHaveBeenCalled();
    mgr.destroy();
  });

  it("wasDismissed() reflects localStorage state", () => {
    const mgr = createPwaInstallManager();
    expect(mgr.wasDismissed()).toBe(false);
    mgr.dismiss();
    expect(mgr.wasDismissed()).toBe(true);
    mgr.destroy();
  });

  it("dismiss() clears the deferred prompt", () => {
    const mgr = createPwaInstallManager();
    const event = new Event("beforeinstallprompt");
    Object.defineProperty(event, "preventDefault", { value: vi.fn(), writable: true });
    window.dispatchEvent(event);
    expect(mgr.isAvailable()).toBe(true);
    mgr.dismiss();
    expect(mgr.isAvailable()).toBe(false);
    mgr.destroy();
  });

  it("prompt() returns unavailable when no deferred prompt", async () => {
    const mgr = createPwaInstallManager();
    const outcome = await mgr.prompt();
    expect(outcome).toBe("unavailable");
    mgr.destroy();
  });

  it("prompt() calls deferredPrompt.prompt() and returns outcome", async () => {
    const mgr = createPwaInstallManager();
    const mockPromptFn = vi.fn().mockResolvedValue(undefined);
    const mockUserChoice = Promise.resolve({ outcome: "accepted" });
    const fakeEvent = {
      preventDefault: vi.fn(),
      prompt: mockPromptFn,
      userChoice: mockUserChoice,
    };
    window.dispatchEvent(Object.assign(new Event("beforeinstallprompt"), fakeEvent));
    const outcome = await mgr.prompt();
    expect(mockPromptFn).toHaveBeenCalled();
    expect(outcome).toBe("accepted");
    mgr.destroy();
  });

  it("onInstalled callback fires on appinstalled event", () => {
    const cb = vi.fn();
    const mgr = createPwaInstallManager();
    mgr.onInstalled(cb);
    window.dispatchEvent(new Event("appinstalled"));
    expect(cb).toHaveBeenCalledOnce();
    mgr.destroy();
  });

  it("destroy() removes event listeners", () => {
    const cb = vi.fn();
    const mgr = createPwaInstallManager();
    mgr.onReady(cb);
    mgr.destroy();
    const event = new Event("beforeinstallprompt");
    Object.defineProperty(event, "preventDefault", { value: vi.fn(), writable: true });
    window.dispatchEvent(event);
    expect(cb).not.toHaveBeenCalled();
  });

  it("offReady() unregisters a callback so it no longer fires", () => {
    const cb = vi.fn();
    const mgr = createPwaInstallManager();
    mgr.onReady(cb);
    mgr.offReady(cb);
    const event = new Event("beforeinstallprompt");
    Object.defineProperty(event, "preventDefault", { value: vi.fn(), writable: true });
    window.dispatchEvent(event);
    expect(cb).not.toHaveBeenCalled();
    mgr.destroy();
  });

  it("offInstalled() unregisters a callback so it no longer fires", () => {
    const cb = vi.fn();
    const mgr = createPwaInstallManager();
    mgr.onInstalled(cb);
    mgr.offInstalled(cb);
    window.dispatchEvent(new Event("appinstalled"));
    expect(cb).not.toHaveBeenCalled();
    mgr.destroy();
  });
});

describe("getPwaInstallManager", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", storageMock());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("returns the same instance across multiple calls", () => {
    expect(getPwaInstallManager()).toBe(getPwaInstallManager());
  });
});
