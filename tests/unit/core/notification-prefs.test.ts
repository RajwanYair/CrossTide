import { describe, it, expect, beforeEach, vi } from "vitest";

function createStorageMock(): Storage {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
  };
}

beforeEach(() => {
  vi.stubGlobal("localStorage", createStorageMock());
  vi.resetModules();
});

describe("notification-prefs", () => {
  async function loadModule() {
    return import("../../../src/core/notification-prefs");
  }

  it("returns defaults when no prefs saved", async () => {
    const { getNotificationPrefs, getDefaults } = await loadModule();
    expect(getNotificationPrefs()).toEqual(getDefaults());
  });

  it("defaults have priceAlerts enabled", async () => {
    const { getNotificationPrefs } = await loadModule();
    expect(getNotificationPrefs().priceAlerts).toBe(true);
  });

  it("defaults have providerFailovers disabled", async () => {
    const { getNotificationPrefs } = await loadModule();
    expect(getNotificationPrefs().providerFailovers).toBe(false);
  });

  it("updateNotificationPrefs changes specific pref", async () => {
    const { updateNotificationPrefs, getNotificationPrefs } = await loadModule();
    updateNotificationPrefs({ providerFailovers: true });
    expect(getNotificationPrefs().providerFailovers).toBe(true);
    expect(getNotificationPrefs().priceAlerts).toBe(true); // others unchanged
  });

  it("isNotificationEnabled checks specific category", async () => {
    const { isNotificationEnabled, disableNotification } = await loadModule();
    expect(isNotificationEnabled("signalFlips")).toBe(true);
    disableNotification("signalFlips");
    expect(isNotificationEnabled("signalFlips")).toBe(false);
  });

  it("enableNotification turns on a category", async () => {
    const { enableNotification, isNotificationEnabled, disableNotification } = await loadModule();
    disableNotification("priceAlerts");
    enableNotification("priceAlerts");
    expect(isNotificationEnabled("priceAlerts")).toBe(true);
  });

  it("persists to localStorage", async () => {
    const { updateNotificationPrefs } = await loadModule();
    updateNotificationPrefs({ dataStale: true });
    const raw = localStorage.getItem("crosstide-notification-prefs");
    expect(raw).toContain('"dataStale":true');
  });

  it("loads from localStorage", async () => {
    localStorage.setItem(
      "crosstide-notification-prefs",
      JSON.stringify({ priceAlerts: false, earningsReminders: false }),
    );
    const { getNotificationPrefs } = await loadModule();
    expect(getNotificationPrefs().priceAlerts).toBe(false);
    expect(getNotificationPrefs().earningsReminders).toBe(false);
    expect(getNotificationPrefs().signalFlips).toBe(true); // merged with defaults
  });

  it("resetNotificationPrefs reverts to defaults", async () => {
    const { updateNotificationPrefs, resetNotificationPrefs, getNotificationPrefs, getDefaults } =
      await loadModule();
    updateNotificationPrefs({ priceAlerts: false, signalFlips: false });
    resetNotificationPrefs();
    expect(getNotificationPrefs()).toEqual(getDefaults());
  });
});
