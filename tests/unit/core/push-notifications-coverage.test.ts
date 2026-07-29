/**
 * Additional coverage tests for src/core/push-notifications.ts
 * Targets uncovered branches: lines 41 (push not supported), 99 (no sub early return),
 * 141 (Notification not in self), 153-157 (non-SW Notification constructor fallback).
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  subscribeToPush,
  unsubscribePush,
  showLocalNotification,
} from "../../../src/core/push-notifications";

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function makePushManager(sub: PushSubscription | null): PushManager {
  return {
    subscribe: vi.fn(async () => sub!),
    getSubscription: vi.fn(async () => sub),
    permissionState: vi.fn(async () => "granted" as PermissionState),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  } as unknown as PushManager;
}

function makeRegistration(pushManager: PushManager): ServiceWorkerRegistration {
  return {
    pushManager,
    showNotification: vi.fn(async () => undefined),
    active: null,
    installing: null,
    waiting: null,
    scope: "/",
    updateViaCache: "none" as const,
    onupdatefound: null,
    update: vi.fn(async () => undefined),
    unregister: vi.fn(async () => true),
    getNotifications: vi.fn(async () => []),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  } as unknown as ServiceWorkerRegistration;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

// ──────────────────────────────────────────────────────────────
// subscribeToPush — push not supported early return (line ~41)
// ──────────────────────────────────────────────────────────────

describe("subscribeToPush — push-not-supported branch (line 41)", () => {
  it("returns ok:false when PushManager is absent from globalThis", async () => {
    // Delete PushManager so that 'PushManager' in self === false
    const g = globalThis as Record<string, unknown>;
    const had = Object.prototype.hasOwnProperty.call(g, "PushManager");
    const orig = g["PushManager"];
    delete g["PushManager"];

    try {
      const result = await subscribeToPush("dGVzdA");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("not supported");
      }
    } finally {
      // Restore regardless of test outcome
      if (had) {
        g["PushManager"] = orig;
      }
    }
  });
});

// ──────────────────────────────────────────────────────────────
// unsubscribePush — no subscription early return (line ~99)
// ──────────────────────────────────────────────────────────────

describe("unsubscribePush — no-subscription early return (line 99)", () => {
  it("returns ok:true immediately when getSubscription returns null", async () => {
    // Ensure isPushSupported() returns true
    vi.stubGlobal("Notification", { permission: "granted" });
    const g = globalThis as Record<string, unknown>;
    // Ensure PushManager is present
    const had = Object.prototype.hasOwnProperty.call(g, "PushManager");
    if (!had) g["PushManager"] = {};

    const pm = makePushManager(null);
    const reg = makeRegistration(pm);
    vi.stubGlobal("navigator", {
      serviceWorker: { ready: Promise.resolve(reg) },
    });

    try {
      const result = await unsubscribePush();
      expect(result.ok).toBe(true);
      // Confirm getSubscription was called (reaching that code path)
      expect(pm.getSubscription).toHaveBeenCalledOnce();
    } finally {
      if (!had) delete g["PushManager"];
    }
  });
});

// ──────────────────────────────────────────────────────────────
// showLocalNotification — Notification not in self (line ~141)
// ──────────────────────────────────────────────────────────────

describe("showLocalNotification — Notification absent branch (line 141)", () => {
  it("returns ok:false when Notification is not in self", async () => {
    const g = globalThis as Record<string, unknown>;
    const had = Object.prototype.hasOwnProperty.call(g, "Notification");
    const orig = g["Notification"];
    delete g["Notification"];

    try {
      const result = await showLocalNotification("Hello");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("not supported");
      }
    } finally {
      if (had) {
        g["Notification"] = orig;
      }
    }
  });
});

// ──────────────────────────────────────────────────────────────
// showLocalNotification — non-SW fallback (lines ~153-157)
// ──────────────────────────────────────────────────────────────

describe("showLocalNotification — non-SW Notification constructor fallback (lines 153-157)", () => {
  it("uses new Notification() when serviceWorker is not in navigator", async () => {
    const NotifCtor = vi.fn();
    // Must have static permission property
    NotifCtor.permission = "granted";
    vi.stubGlobal("Notification", NotifCtor);

    // Navigator without serviceWorker property
    vi.stubGlobal("navigator", {});

    const result = await showLocalNotification("FallbackTitle", {
      body: "FallbackBody",
      icon: "/icon.png",
      tag: "ftag",
    });
    expect(result.ok).toBe(true);
    expect(NotifCtor).toHaveBeenCalledOnce();
    const [title, opts] = NotifCtor.mock.calls[0] as [string, NotificationOptions];
    expect(title).toBe("FallbackTitle");
    expect(opts.body).toBe("FallbackBody");
    expect(opts.icon).toBe("/icon.png");
    expect(opts.tag).toBe("ftag");
  });

  it("returns ok:false when new Notification() throws", async () => {
    const NotifCtor = vi.fn().mockImplementation(function throwNotificationError() {
      throw new Error("Notification ctor error");
    });
    NotifCtor.permission = "granted";
    vi.stubGlobal("Notification", NotifCtor);
    vi.stubGlobal("navigator", {});

    const result = await showLocalNotification("Title");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Notification ctor error");
    }
  });

  it("omits undefined body/icon/tag from NotificationOptions", async () => {
    const NotifCtor = vi.fn();
    NotifCtor.permission = "granted";
    vi.stubGlobal("Notification", NotifCtor);
    vi.stubGlobal("navigator", {});

    await showLocalNotification("TitleOnly");
    const [, opts] = NotifCtor.mock.calls[0] as [string, NotificationOptions];
    expect(opts.body).toBeUndefined();
    expect(opts.icon).toBeUndefined();
    expect(opts.tag).toBeUndefined();
  });
});

// ──────────────────────────────────────────────────────────────
// subscribeToPush — additional branches
// ──────────────────────────────────────────────────────────────

describe("subscribeToPush — missing keys and SW errors", () => {
  it("returns error when p256dh or auth key is null (line 83)", async () => {
    const g = globalThis as Record<string, unknown>;
    if (!g["PushManager"]) g["PushManager"] = {};

    const mockSub = {
      endpoint: "https://example.com/push",
      getKey: vi.fn().mockReturnValue(null),
    };
    const pm = makePushManager(mockSub as unknown as PushSubscription);
    const reg = makeRegistration(pm);

    const NotifCtor = vi.fn();
    NotifCtor.permission = "granted";
    NotifCtor.requestPermission = vi.fn(async () => "granted");
    vi.stubGlobal("Notification", NotifCtor);
    vi.stubGlobal("navigator", {
      serviceWorker: { ready: Promise.resolve(reg) },
    });

    const result = await subscribeToPush("dGVzdA");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Missing p256dh or auth");
    }
  });

  it("returns error when SW ready rejects (line 58)", async () => {
    const g = globalThis as Record<string, unknown>;
    if (!g["PushManager"]) g["PushManager"] = {};

    const NotifCtor = vi.fn();
    NotifCtor.permission = "granted";
    NotifCtor.requestPermission = vi.fn(async () => "granted");
    vi.stubGlobal("Notification", NotifCtor);
    vi.stubGlobal("navigator", {
      serviceWorker: { ready: Promise.reject(new Error("SW failed")) },
    });

    const result = await subscribeToPush("dGVzdA");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("SW not ready");
    }
  });

  it("returns error when notification permission is denied (line 48)", async () => {
    const g = globalThis as Record<string, unknown>;
    if (!g["PushManager"]) g["PushManager"] = {};

    const NotifCtor = vi.fn();
    NotifCtor.permission = "denied";
    NotifCtor.requestPermission = vi.fn(async () => "denied");
    vi.stubGlobal("Notification", NotifCtor);
    vi.stubGlobal("navigator", {
      serviceWorker: { ready: Promise.resolve({}) },
    });

    const result = await subscribeToPush("dGVzdA");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("permission denied");
    }
  });
});

describe("unsubscribePush — error branches", () => {
  it("returns error when getSubscription throws (line 108)", async () => {
    const g = globalThis as Record<string, unknown>;
    if (!g["PushManager"]) g["PushManager"] = {};

    const pm = {
      getSubscription: vi.fn().mockRejectedValue(new Error("DB error")),
    } as unknown as PushManager;
    const reg = makeRegistration(pm);

    vi.stubGlobal("Notification", { permission: "granted" });
    vi.stubGlobal("navigator", {
      serviceWorker: { ready: Promise.resolve(reg) },
    });

    const result = await unsubscribePush();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("getSubscription failed");
    }
  });

  it("returns error when sub.unsubscribe() throws (line 112)", async () => {
    const g = globalThis as Record<string, unknown>;
    if (!g["PushManager"]) g["PushManager"] = {};

    const mockSub = {
      unsubscribe: vi.fn().mockRejectedValue(new Error("Network error")),
    };
    const pm = {
      getSubscription: vi.fn(async () => mockSub),
    } as unknown as PushManager;
    const reg = makeRegistration(pm);

    vi.stubGlobal("Notification", { permission: "granted" });
    vi.stubGlobal("navigator", {
      serviceWorker: { ready: Promise.resolve(reg) },
    });

    const result = await unsubscribePush();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("unsubscribe failed");
    }
  });
});
