/** UI consumer tests for restoring the active dashboard layout preset. */
import { beforeEach, describe, expect, it, vi } from "vitest";

function createStorageMock(): Storage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
    get length() {
      return values.size;
    },
    key: (index) => [...values.keys()][index] ?? null,
  };
}

beforeEach(() => {
  document.body.innerHTML = `
    <main id="app-main">
      <section id="view-chart" class="view"></section>
      <section id="view-watchlist" class="view"></section>
      <section id="view-settings" class="view"></section>
    </main>
  `;
  vi.stubGlobal("localStorage", createStorageMock());
  vi.resetModules();
});

describe("restoreActiveLayoutPreset", () => {
  it("restores the saved order and retains new sections", async () => {
    const presets = await import("../../../src/core/layout-presets");
    presets.savePreset("Trading", ["watchlist", "chart"]);
    presets.setActivePreset("Trading");

    const { restoreActiveLayoutPreset } = await import("../../../src/ui/layout-presets");
    expect(restoreActiveLayoutPreset()).toBe(true);
    expect(
      [...document.querySelectorAll("#app-main > section")].map((section) => section.id),
    ).toEqual(["view-watchlist", "view-chart", "view-settings"]);
  });

  it("ignores unknown saved sections", async () => {
    const presets = await import("../../../src/core/layout-presets");
    presets.savePreset("Partial", ["missing", "settings"]);
    presets.setActivePreset("Partial");

    const { restoreActiveLayoutPreset } = await import("../../../src/ui/layout-presets");
    expect(restoreActiveLayoutPreset()).toBe(true);
    expect(document.querySelector("#app-main > section:first-child")?.id).toBe("view-settings");
  });
});
