import { describe, it, expect, beforeEach, vi } from "vitest";

function createStorageMock() {
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

describe("layout-presets", () => {
  async function loadModule() {
    return import("../../../src/core/layout-presets");
  }

  it("starts with no presets", async () => {
    const { getPresets } = await loadModule();
    expect(getPresets()).toEqual([]);
  });

  it("saves and retrieves a preset", async () => {
    const { savePreset, getPreset } = await loadModule();
    savePreset("Default", ["watchlist", "chart", "screener"]);
    const preset = getPreset("Default");
    expect(preset).not.toBeNull();
    expect(preset!.name).toBe("Default");
    expect(preset!.cards).toEqual(["watchlist", "chart", "screener"]);
  });

  it("overwrites existing preset with same name", async () => {
    const { savePreset, getPresets } = await loadModule();
    savePreset("Work", ["chart"]);
    savePreset("Work", ["chart", "portfolio"]);
    expect(getPresets()).toHaveLength(1);
    expect(getPresets()[0]!.cards).toEqual(["chart", "portfolio"]);
  });

  it("deletePreset removes by name", async () => {
    const { savePreset, deletePreset, getPresets } = await loadModule();
    savePreset("A", ["chart"]);
    savePreset("B", ["screener"]);
    expect(deletePreset("A")).toBe(true);
    expect(getPresets()).toHaveLength(1);
    expect(deletePreset("X")).toBe(false);
  });

  it("renamePreset changes the name", async () => {
    const { savePreset, renamePreset, getPreset } = await loadModule();
    savePreset("Old", ["chart"]);
    expect(renamePreset("Old", "New")).toBe(true);
    expect(getPreset("Old")).toBeNull();
    expect(getPreset("New")).not.toBeNull();
  });

  it("renamePreset fails if new name already exists", async () => {
    const { savePreset, renamePreset } = await loadModule();
    savePreset("A", ["chart"]);
    savePreset("B", ["screener"]);
    expect(renamePreset("A", "B")).toBe(false);
  });

  it("setActivePreset and getActivePreset work", async () => {
    const { setActivePreset, getActivePreset } = await loadModule();
    expect(getActivePreset()).toBeNull();
    setActivePreset("Trading");
    expect(getActivePreset()).toBe("Trading");
    setActivePreset(null);
    expect(getActivePreset()).toBeNull();
  });

  it("persists to localStorage", async () => {
    const mod1 = await loadModule();
    mod1.savePreset("Persist", ["heatmap"]);
    vi.resetModules();
    const mod2 = await loadModule();
    expect(mod2.getPreset("Persist")).not.toBeNull();
  });

  it("caps at MAX_PRESETS", async () => {
    const { savePreset, getPresets, getMaxPresets } = await loadModule();
    const max = getMaxPresets();
    for (let i = 0; i < max + 5; i++) {
      savePreset(`P${i}`, [`card${i}`]);
    }
    expect(getPresets()).toHaveLength(max);
  });

  it("clearPresets removes everything", async () => {
    const { savePreset, setActivePreset, clearPresets, getPresets, getActivePreset } =
      await loadModule();
    savePreset("X", ["chart"]);
    setActivePreset("X");
    clearPresets();
    expect(getPresets()).toEqual([]);
    expect(getActivePreset()).toBeNull();
  });
});
