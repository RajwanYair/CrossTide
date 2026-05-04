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

describe("net-worth", () => {
  async function loadModule() {
    return import("../../../src/core/net-worth");
  }

  it("starts with empty history", async () => {
    const { getHistory } = await loadModule();
    expect(getHistory()).toEqual([]);
  });

  it("recordNetWorth adds entry", async () => {
    const { recordNetWorth, getHistory } = await loadModule();
    recordNetWorth(50000, "2026-01-01");
    expect(getHistory()).toHaveLength(1);
    expect(getHistory()[0]!.value).toBe(50000);
  });

  it("entries are sorted by date", async () => {
    const { recordNetWorth, getHistory } = await loadModule();
    recordNetWorth(60000, "2026-03-01");
    recordNetWorth(50000, "2026-01-01");
    recordNetWorth(55000, "2026-02-01");
    const hist = getHistory();
    expect(hist[0]!.date).toBe("2026-01-01");
    expect(hist[2]!.date).toBe("2026-03-01");
  });

  it("getSummary provides current and change", async () => {
    const { recordNetWorth, getSummary } = await loadModule();
    recordNetWorth(50000, "2026-01-01");
    recordNetWorth(55000, "2026-02-01");
    const s = getSummary();
    expect(s.currentValue).toBe(55000);
    expect(s.previousValue).toBe(50000);
    expect(s.changeAmount).toBe(5000);
    expect(s.changePercent).toBe(10);
  });

  it("getSummary tracks all-time high/low", async () => {
    const { recordNetWorth, getSummary } = await loadModule();
    recordNetWorth(50000, "2026-01-01");
    recordNetWorth(45000, "2026-02-01");
    recordNetWorth(60000, "2026-03-01");
    const s = getSummary();
    expect(s.allTimeHigh).toBe(60000);
    expect(s.allTimeLow).toBe(45000);
  });

  it("goalProgress calculates percent", async () => {
    const { recordNetWorth, goalProgress } = await loadModule();
    recordNetWorth(50000, "2026-01-01");
    const progress = goalProgress({ targetValue: 100000, targetDate: "2027-01-01" });
    expect(progress.percent).toBe(50);
    expect(progress.remaining).toBe(50000);
  });

  it("cagr computes growth rate", async () => {
    const { recordNetWorth, cagr } = await loadModule();
    recordNetWorth(10000, "2025-01-01");
    recordNetWorth(11000, "2026-01-01"); // 10% in 1 year
    const rate = cagr();
    expect(rate).toBeCloseTo(10, 0);
  });

  it("deleteEntry removes by date", async () => {
    const { recordNetWorth, deleteEntry, getHistory } = await loadModule();
    recordNetWorth(50000, "2026-01-01");
    recordNetWorth(55000, "2026-02-01");
    expect(deleteEntry("2026-01-01")).toBe(true);
    expect(getHistory()).toHaveLength(1);
  });

  it("clearHistory removes all", async () => {
    const { recordNetWorth, clearHistory, getHistory } = await loadModule();
    recordNetWorth(50000, "2026-01-01");
    clearHistory();
    expect(getHistory()).toEqual([]);
  });

  it("persists to localStorage", async () => {
    const mod1 = await loadModule();
    mod1.recordNetWorth(50000, "2026-01-01");
    vi.resetModules();
    const mod2 = await loadModule();
    expect(mod2.getHistory()).toHaveLength(1);
  });

  it("getSummary returns zeros for empty", async () => {
    const { getSummary } = await loadModule();
    const s = getSummary();
    expect(s.currentValue).toBe(0);
    expect(s.entryCount).toBe(0);
  });
});
