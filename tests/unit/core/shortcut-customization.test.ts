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

describe("shortcut-customization", () => {
  async function loadModule() {
    return import("../../../src/core/shortcut-customization");
  }

  const refreshDef = {
    action: "refresh",
    description: "Refresh data",
    defaultBinding: { key: "r" },
  };

  it("returns default binding when no custom is set", async () => {
    const { getBinding } = await loadModule();
    expect(getBinding(refreshDef)).toEqual({ key: "r" });
  });

  it("returns custom binding when set", async () => {
    const { getBinding, setCustomBinding } = await loadModule();
    setCustomBinding("refresh", { key: "r", ctrl: true });
    expect(getBinding(refreshDef)).toEqual({ key: "r", ctrl: true });
  });

  it("resetBinding reverts to default", async () => {
    const { getBinding, setCustomBinding, resetBinding } = await loadModule();
    setCustomBinding("refresh", { key: "f5" });
    resetBinding("refresh");
    expect(getBinding(refreshDef)).toEqual({ key: "r" });
  });

  it("resetAllBindings clears all customs", async () => {
    const { setCustomBinding, resetAllBindings, getAllCustomBindings } = await loadModule();
    setCustomBinding("refresh", { key: "f5" });
    setCustomBinding("search", { key: "/", ctrl: true });
    resetAllBindings();
    expect(getAllCustomBindings().size).toBe(0);
  });

  it("persists to localStorage", async () => {
    const { setCustomBinding } = await loadModule();
    setCustomBinding("refresh", { key: "r", ctrl: true });
    const raw = localStorage.getItem("crosstide-custom-shortcuts");
    expect(raw).toContain("refresh");
    expect(raw).toContain("ctrl");
  });

  it("loads from localStorage", async () => {
    localStorage.setItem(
      "crosstide-custom-shortcuts",
      JSON.stringify({ refresh: { key: "f5", ctrl: true } }),
    );
    const { getBinding } = await loadModule();
    expect(getBinding(refreshDef)).toEqual({ key: "f5", ctrl: true });
  });

  it("formatBinding produces readable combo", async () => {
    const { formatBinding } = await loadModule();
    expect(formatBinding({ key: "r", ctrl: true, shift: true })).toBe("Ctrl+Shift+R");
    expect(formatBinding({ key: "?" })).toBe("?");
    expect(formatBinding({ key: "Escape" })).toBe("Escape");
  });

  it("parseBinding parses combo string", async () => {
    const { parseBinding } = await loadModule();
    expect(parseBinding("Ctrl+Shift+R")).toEqual({ key: "r", ctrl: true, shift: true });
    expect(parseBinding("Alt+F")).toEqual({ key: "f", alt: true });
    expect(parseBinding("Escape")).toEqual({ key: "Escape" });
  });
});
