import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isNotificationsSupported,
  getNotificationPermission,
  requestNotificationPermission,
  showNotification,
} from "../../../src/core/notifications";

const origDescriptor = Object.getOwnPropertyDescriptor(globalThis, "Notification");

class FakeNotification {
  static permission: NotificationPermission = "default";
  static lastInstance: FakeNotification | null = null;
  static requestPermission = vi.fn(async (): Promise<NotificationPermission> => "granted");
  public onclick: (() => void) | null = null;
  public closed = false;
  constructor(
    public title: string,
    public options?: NotificationOptions,
  ) {
    FakeNotification.lastInstance = this;
  }
  close(): void {
    this.closed = true;
  }
}

describe("notifications", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "Notification", {
      value: FakeNotification,
      configurable: true,
      writable: true,
    });
    FakeNotification.permission = "default";
    FakeNotification.lastInstance = null;
    FakeNotification.requestPermission.mockClear();
  });

  afterEach(() => {
    if (origDescriptor) {
      Object.defineProperty(globalThis, "Notification", origDescriptor);
    } else {
      delete (globalThis as { Notification?: unknown }).Notification;
    }
  });

  it("reports support and permission state", () => {
    expect(isNotificationsSupported()).toBe(true);
    expect(getNotificationPermission()).toBe("default");
  });

  it("requests permission via Notification API", async () => {
    FakeNotification.requestPermission.mockResolvedValueOnce("granted");
    const r = await requestNotificationPermission();
    expect(r).toBe("granted");
    expect(FakeNotification.requestPermission).toHaveBeenCalledOnce();
  });

  it("returns no-op when not supported", () => {
    delete (globalThis as { Notification?: unknown }).Notification;
    expect(isNotificationsSupported()).toBe(false);
    expect(getNotificationPermission()).toBe("unsupported");
    const close = showNotification("hi");
    close();
  });

  it("does not create when permission not granted", () => {
    FakeNotification.permission = "denied";
    showNotification("hi", { body: "x" });
    expect(FakeNotification.lastInstance).toBeNull();
  });

  it("creates notification when granted, close cleans up", () => {
    FakeNotification.permission = "granted";
    const close = showNotification("hi", { body: "x", tag: "t1" });
    expect(FakeNotification.lastInstance).not.toBeNull();
    expect(FakeNotification.lastInstance?.options?.body).toBe("x");
    close();
    expect(FakeNotification.lastInstance?.closed).toBe(true);
  });

  it("attaches onClick handler", () => {
    FakeNotification.permission = "granted";
    const fn = vi.fn();
    showNotification("hi", { onClick: fn });
    FakeNotification.lastInstance?.onclick?.();
    expect(fn).toHaveBeenCalledOnce();
  });
});
