import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isPushSupported,
  subscribeToPush,
  unsubscribePush,
  showLocalNotification,
  urlBase64ToUint8Array,
  arrayBufferToBase64,
} from "../../../src/core/push-notifications";

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function makePushSubscription(
  endpoint: string,
  p256dh: ArrayBuffer,
  auth: ArrayBuffer,
): PushSubscription {
  return {
    endpoint,
    expirationTime: null,
    options: { applicationServerKey: null, userVisibleOnly: true },
    getKey: (name: string) => {
      if (name === "p256dh") return p256dh;
      if (name === "auth") return auth;
      return null;
    },
    toJSON: () => ({ endpoint, expirationTime: null, keys: {} }),
    unsubscribe: vi.fn(async () => true),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  } as unknown as PushSubscription;
}

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

// ──────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────

describe("isPushSupported", () => {
  it("returns false when serviceWorker is missing", () => {
    const orig = navigator.serviceWorker;
    // @ts-expect-error — intentional
    delete (navigator as { serviceWorker?: unknown }).serviceWorker;
    expect(isPushSupported()).toBe(false);
    Object.defineProperty(navigator, "serviceWorker", { value: orig, configurable: true });
  });

  it("returns false when PushManager is missing", () => {
    // In happy-dom / jsdom PushManager is typically undefined
    expect(isPushSupported()).toBe(false);
  });
});

describe("urlBase64ToUint8Array", () => {
  it("converts a URL-safe base64 string to Uint8Array", () => {
    // "hello" in URL-safe base64 → Uint8Array of "hello"
    const encoded = btoa("hello").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const arr = urlBase64ToUint8Array(encoded);
    expect(arr).toBeInstanceOf(Uint8Array);
    expect(arr.length).toBe(5);
    expect(Array.from(arr)).toEqual([104, 101, 108, 108, 111]);
  });

  it("handles strings that need padding", () => {
    const encoded = "YQ"; // base64 for "a", no trailing =
    const arr = urlBase64ToUint8Array(encoded);
    expect(arr[0]).toBe(97); // 'a'
  });
});

describe("arrayBufferToBase64", () => {
  it("converts an ArrayBuffer to a URL-safe base64 string", () => {
    const buf = new TextEncoder().encode("hello").buffer;
    const result = arrayBufferToBase64(buf);
    // Should match btoa("hello") without padding
    const expected = btoa("hello").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    expect(result).toBe(expected);
  });

  it("round-trips with urlBase64ToUint8Array", () => {
    const original = new Uint8Array([1, 2, 3, 200, 201]);
    const encoded = arrayBufferToBase64(original.buffer);
    const decoded = urlBase64ToUint8Array(encoded);
    expect(Array.from(decoded)).toEqual(Array.from(original));
  });
});

describe("subscribeToPush", () => {
  beforeEach(() => {
    vi.stubGlobal("Notification", {
      permission: "granted",
      requestPermission: vi.fn(async () => "granted"),
    });
    vi.stubGlobal("PushManager", {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns ok:false when push not supported", async () => {
    vi.stubGlobal("PushManager", undefined);
    const result = await subscribeToPush("test-key");
    expect(result.ok).toBe(false);
  });

  it("returns ok:false when permission denied", async () => {
    vi.stubGlobal("PushManager", {});
    vi.stubGlobal("Notification", {
      permission: "denied",
      requestPermission: vi.fn(async () => "denied"),
    });
    vi.stubGlobal("navigator", {
      ...navigator,
      serviceWorker: { ready: Promise.resolve(makeRegistration(makePushManager(null))) },
    });
    const result = await subscribeToPush("test-key");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("denied");
    }
  });

  it("returns ok:true with payload when subscription succeeds", async () => {
    const p256dhBuf = new TextEncoder().encode("fakep256dh").buffer;
    const authBuf = new TextEncoder().encode("fakeauth").buffer;
    const fakeSub = makePushSubscription("https://push.example.com/1", p256dhBuf, authBuf);
    const pm = makePushManager(fakeSub);
    const reg = makeRegistration(pm);

    vi.stubGlobal("navigator", {
      ...navigator,
      serviceWorker: { ready: Promise.resolve(reg) },
    });
    vi.stubGlobal("PushManager", {});

    const result = await subscribeToPush("dGVzdA"); // "test" in base64
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.endpoint).toBe("https://push.example.com/1");
      expect(result.value.keys.p256dh).toBeTruthy();
      expect(result.value.keys.auth).toBeTruthy();
    }
  });
});

describe("unsubscribePush", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns ok:false when push not supported", async () => {
    const result = await unsubscribePush();
    expect(result.ok).toBe(false);
  });

  it("returns ok:true when no active subscription", async () => {
    vi.stubGlobal("PushManager", {});
    vi.stubGlobal("Notification", { permission: "granted" });
    const pm = makePushManager(null);
    const reg = makeRegistration(pm);
    vi.stubGlobal("navigator", {
      ...navigator,
      serviceWorker: { ready: Promise.resolve(reg) },
    });
    const result = await unsubscribePush();
    expect(result.ok).toBe(true);
  });

  it("calls sub.unsubscribe() when subscription exists", async () => {
    vi.stubGlobal("PushManager", {});
    vi.stubGlobal("Notification", { permission: "granted" });
    const p256dh = new ArrayBuffer(0);
    const auth = new ArrayBuffer(0);
    const sub = makePushSubscription("https://push.example.com/2", p256dh, auth);
    const pm = makePushManager(sub);
    const reg = makeRegistration(pm);
    vi.stubGlobal("navigator", {
      ...navigator,
      serviceWorker: { ready: Promise.resolve(reg) },
    });
    const result = await unsubscribePush();
    expect(result.ok).toBe(true);
    expect(sub.unsubscribe).toHaveBeenCalledOnce();
  });
});

describe("showLocalNotification", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns ok:false when Notification not granted", async () => {
    vi.stubGlobal("Notification", { permission: "denied" });
    const result = await showLocalNotification("Test");
    expect(result.ok).toBe(false);
  });

  it("calls showNotification on SW registration", async () => {
    vi.stubGlobal("Notification", { permission: "granted" });
    const reg = makeRegistration(makePushManager(null));
    vi.stubGlobal("navigator", {
      ...navigator,
      serviceWorker: { ready: Promise.resolve(reg) },
    });
    const result = await showLocalNotification("Hello", { body: "World" });
    expect(result.ok).toBe(true);
    expect(reg.showNotification).toHaveBeenCalledWith("Hello", expect.objectContaining({ body: "World" }));
  });
});
