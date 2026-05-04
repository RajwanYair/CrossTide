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
  document.body.innerHTML = "";
});

describe("card-width", () => {
  async function loadModule() {
    return import("../../../src/ui/card-width");
  }

  it("defaults to full width", async () => {
    const { getCardWidth } = await loadModule();
    expect(getCardWidth("chart")).toBe("full");
  });

  it("sets and retrieves card width", async () => {
    const { setCardWidth, getCardWidth } = await loadModule();
    setCardWidth("chart", "half");
    expect(getCardWidth("chart")).toBe("half");
  });

  it("toggles between full and half", async () => {
    const { toggleCardWidth, getCardWidth } = await loadModule();
    const result = toggleCardWidth("chart");
    expect(result).toBe("half");
    expect(getCardWidth("chart")).toBe("half");
    const result2 = toggleCardWidth("chart");
    expect(result2).toBe("full");
  });

  it("persists to localStorage", async () => {
    const { setCardWidth } = await loadModule();
    setCardWidth("screener", "half");
    const raw = localStorage.getItem("crosstide-card-widths");
    expect(raw).toContain("screener");
    expect(raw).toContain("half");
  });

  it("applies card-half class to DOM element", async () => {
    document.body.innerHTML = `<div data-card-id="chart" class="card"></div>`;
    const { setCardWidth } = await loadModule();
    setCardWidth("chart", "half");
    const el = document.querySelector('[data-card-id="chart"]');
    expect(el?.classList.contains("card-half")).toBe(true);
  });

  it("removes card-half class when set to full", async () => {
    document.body.innerHTML = `<div data-card-id="chart" class="card card-half"></div>`;
    const { setCardWidth } = await loadModule();
    setCardWidth("chart", "full");
    const el = document.querySelector('[data-card-id="chart"]');
    expect(el?.classList.contains("card-half")).toBe(false);
  });

  it("applyAllCardWidths applies all persisted widths", async () => {
    localStorage.setItem(
      "crosstide-card-widths",
      JSON.stringify({ chart: "half", screener: "half" }),
    );
    document.body.innerHTML = `
      <div data-card-id="chart" class="card"></div>
      <div data-card-id="screener" class="card"></div>
    `;
    const { applyAllCardWidths } = await loadModule();
    applyAllCardWidths();
    expect(document.querySelector('[data-card-id="chart"]')?.classList.contains("card-half")).toBe(
      true,
    );
    expect(
      document.querySelector('[data-card-id="screener"]')?.classList.contains("card-half"),
    ).toBe(true);
  });
});
