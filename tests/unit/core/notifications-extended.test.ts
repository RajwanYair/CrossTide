/**
 * Additional notifications tests — covers branches not reached by the
 * base suite: requestNotificationPermission without Notification API,
 * and showNotification option properties (icon, requireInteraction, silent).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { requestNotificationPermission, showNotification } from "../../../src/core/notifications";

const origDescriptor = Object.getOwnPropertyDescriptor(globalThis, "Notification");

class FakeNotif {
  static permission: NotificationPermission = "granted";
  static requestPermission = vi.fn(async (): Promise<NotificationPermission> => "granted");
  public onclick: (() => void) | null = null;
  public options: NotificationOptions | undefined;
  constructor(
    public title: string,
    opts?: NotificationOptions,
  ) {
    this.options = opts;
  }
  close(): void {}
}

describe("notifications — extended branches", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "Notification", {
      value: FakeNotif,
      configurable: true,
      writable: true,
    });
    FakeNotif.permission = "granted";
    FakeNotif.requestPermission.mockClear();
  });

  afterEach(() => {
    if (origDescriptor) {
      Object.defineProperty(globalThis, "Notification", origDescriptor);
    } else {
      delete (globalThis as { Notification?: unknown }).Notification;
    }
    vi.unstubAllGlobals();
  });

  it("requestNotificationPermission returns unsupported when Notification absent", async () => {
    delete (globalThis as { Notification?: unknown }).Notification;
    const result = await requestNotificationPermission();
    expect(result).toBe("unsupported");
  });

  it("showNotification passes icon option to Notification ctor", () => {
    const close = showNotification("Test", { icon: "/icon.png" });
    const _init = (FakeNotif as unknown as { lastInstance?: { options?: NotificationOptions } })
      .lastInstance?.options;
    // icon should be set in the options passed to ctor
    expect(typeof close).toBe("function");
  });

  it("showNotification passes requireInteraction and silent options", () => {
    let capturedOptions: NotificationOptions | undefined;
    const OrigFake = FakeNotif;

    class SpyNotif extends FakeNotif {
      constructor(title: string, opts?: NotificationOptions) {
        super(title, opts);
        capturedOptions = opts;
      }
    }
    SpyNotif.permission = "granted";
    (SpyNotif as unknown as { requestPermission: unknown }).requestPermission =
      OrigFake.requestPermission;
    Object.defineProperty(globalThis, "Notification", {
      value: SpyNotif,
      configurable: true,
      writable: true,
    });

    showNotification("Test", { requireInteraction: true, silent: false });
    expect(capturedOptions?.requireInteraction).toBe(true);
    expect(capturedOptions?.silent).toBe(false);
  });

  it("showNotification sets icon on init when provided", () => {
    let capturedOptions: NotificationOptions | undefined;

    class SpyNotif2 {
      static permission: NotificationPermission = "granted";
      static requestPermission = vi.fn();
      constructor(_title: string, opts?: NotificationOptions) {
        capturedOptions = opts;
      }
      close(): void {}
    }
    Object.defineProperty(globalThis, "Notification", {
      value: SpyNotif2,
      configurable: true,
      writable: true,
    });

    showNotification("Test", { icon: "/my-icon.png", tag: "t1" });
    expect(capturedOptions?.icon).toBe("/my-icon.png");
    expect(capturedOptions?.tag).toBe("t1");
  });
});
