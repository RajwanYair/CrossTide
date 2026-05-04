import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

function createStorageMock(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    key(_i: number) {
      return null;
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

describe("card-collapse", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createStorageMock());
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function loadModule(): Promise<typeof import("../../../src/ui/card-collapse")> {
    return import("../../../src/ui/card-collapse");
  }

  it("starts with no cards collapsed", async () => {
    const { isCardCollapsed } = await loadModule();
    expect(isCardCollapsed("watchlist")).toBe(false);
    expect(isCardCollapsed("chart")).toBe(false);
  });

  it("toggles collapse state and persists", async () => {
    const { toggleCardCollapse, isCardCollapsed } = await loadModule();
    const result = toggleCardCollapse("watchlist");
    expect(result).toBe(true);
    expect(isCardCollapsed("watchlist")).toBe(true);

    const result2 = toggleCardCollapse("watchlist");
    expect(result2).toBe(false);
    expect(isCardCollapsed("watchlist")).toBe(false);
  });

  it("persists collapsed state in localStorage", async () => {
    const { toggleCardCollapse } = await loadModule();
    toggleCardCollapse("chart");
    const stored = JSON.parse(localStorage.getItem("crosstide-collapsed-cards") ?? "[]");
    expect(stored).toContain("chart");
  });

  it("initCardCollapse adds collapse buttons to card headers", async () => {
    document.body.innerHTML = `
      <section id="view-watchlist" class="view">
        <div class="card">
          <div class="card-header"><h2>Watchlist</h2></div>
          <div id="watchlist-content">Content here</div>
        </div>
      </section>
    `;
    const { initCardCollapse } = await loadModule();
    initCardCollapse();
    const btn = document.querySelector(".btn-collapse");
    expect(btn).not.toBeNull();
    expect(btn?.getAttribute("aria-expanded")).toBe("true");
  });

  it("clicking collapse button hides card content", async () => {
    document.body.innerHTML = `
      <section id="view-chart" class="view">
        <div class="card">
          <div class="card-header"><h2>Chart</h2></div>
          <div id="chart-content">Chart content</div>
        </div>
      </section>
    `;
    const { initCardCollapse } = await loadModule();
    initCardCollapse();
    const btn = document.querySelector<HTMLButtonElement>(".btn-collapse")!;
    btn.click();
    const content = document.getElementById("chart-content")!;
    expect(content.style.display).toBe("none");
    expect(btn.getAttribute("aria-expanded")).toBe("false");
  });
});
