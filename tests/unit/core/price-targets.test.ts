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

describe("price-targets", () => {
  async function loadModule() {
    return import("../../../src/core/price-targets");
  }

  it("starts with no targets", async () => {
    const { getAllTargets } = await loadModule();
    expect(getAllTargets()).toEqual([]);
  });

  it("addPriceTarget stores target", async () => {
    const { addPriceTarget, getTargets } = await loadModule();
    addPriceTarget("aapl", 200, 150, "long", "Breakout play");
    const targets = getTargets("AAPL");
    expect(targets).toHaveLength(1);
    expect(targets[0]!.targetPrice).toBe(200);
    expect(targets[0]!.entryPrice).toBe(150);
    expect(targets[0]!.direction).toBe("long");
    expect(targets[0]!.note).toBe("Breakout play");
  });

  it("removeTarget deletes by ticker and price", async () => {
    const { addPriceTarget, removeTarget, getAllTargets } = await loadModule();
    addPriceTarget("AAPL", 200, 150);
    addPriceTarget("MSFT", 400, 350);
    expect(removeTarget("AAPL", 200)).toBe(true);
    expect(getAllTargets()).toHaveLength(1);
    expect(removeTarget("GOOG", 100)).toBe(false);
  });

  it("calculateProgress shows 50% when halfway to long target", async () => {
    const { addPriceTarget, getTargets, calculateProgress } = await loadModule();
    addPriceTarget("AAPL", 200, 100, "long");
    const target = getTargets("AAPL")[0]!;
    const progress = calculateProgress(target, 150);
    expect(progress.progressPercent).toBeCloseTo(50, 5);
    expect(progress.hit).toBe(false);
  });

  it("calculateProgress detects hit for long", async () => {
    const { addPriceTarget, getTargets, calculateProgress } = await loadModule();
    addPriceTarget("AAPL", 200, 150, "long");
    const target = getTargets("AAPL")[0]!;
    const progress = calculateProgress(target, 210);
    expect(progress.hit).toBe(true);
    expect(progress.progressPercent).toBeGreaterThan(100);
  });

  it("calculateProgress works for short direction", async () => {
    const { addPriceTarget, getTargets, calculateProgress } = await loadModule();
    addPriceTarget("TSLA", 80, 100, "short");
    const target = getTargets("TSLA")[0]!;
    const progress = calculateProgress(target, 90);
    expect(progress.progressPercent).toBeCloseTo(50, 5);
    expect(progress.hit).toBe(false);
  });

  it("calculateProgress detects hit for short", async () => {
    const { addPriceTarget, getTargets, calculateProgress } = await loadModule();
    addPriceTarget("TSLA", 80, 100, "short");
    const target = getTargets("TSLA")[0]!;
    const progress = calculateProgress(target, 75);
    expect(progress.hit).toBe(true);
  });

  it("checkAllTargets processes multiple tickers", async () => {
    const { addPriceTarget, checkAllTargets } = await loadModule();
    addPriceTarget("AAPL", 200, 150, "long");
    addPriceTarget("MSFT", 400, 350, "long");
    const prices = new Map([
      ["AAPL", 175],
      ["MSFT", 380],
    ]);
    const results = checkAllTargets(prices);
    expect(results).toHaveLength(2);
  });

  it("getHitTargets filters only those reached", async () => {
    const { addPriceTarget, checkAllTargets, getHitTargets } = await loadModule();
    addPriceTarget("AAPL", 200, 150, "long");
    addPriceTarget("MSFT", 400, 350, "long");
    const prices = new Map([
      ["AAPL", 205],
      ["MSFT", 370],
    ]);
    const results = checkAllTargets(prices);
    const hits = getHitTargets(results);
    expect(hits).toHaveLength(1);
    expect(hits[0]!.ticker).toBe("AAPL");
  });

  it("persists to localStorage", async () => {
    const mod1 = await loadModule();
    mod1.addPriceTarget("GOOG", 200, 100);
    vi.resetModules();
    const mod2 = await loadModule();
    expect(mod2.getAllTargets()).toHaveLength(1);
  });

  it("clearAllTargets removes everything", async () => {
    const { addPriceTarget, clearAllTargets, getAllTargets } = await loadModule();
    addPriceTarget("AAPL", 200, 150);
    clearAllTargets();
    expect(getAllTargets()).toEqual([]);
  });
});
