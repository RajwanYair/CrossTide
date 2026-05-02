/**
 * Sector heatmap card tests.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  computeHeatmapLayout,
  changeColor,
  renderHeatmap,
  renderSectorDrillDown,
  sortConstituents,
  absoluteMove,
  type SectorData,
  type ConstituentStock,
  type SectorDataWithConstituents,
} from "../../../src/cards/heatmap";

const SECTORS: SectorData[] = [
  { sector: "Technology", marketCap: 500, changePercent: 1.2, tickerCount: 50 },
  { sector: "Healthcare", marketCap: 300, changePercent: -0.8, tickerCount: 30 },
  { sector: "Energy", marketCap: 200, changePercent: 2.5, tickerCount: 20 },
];

describe("computeHeatmapLayout", () => {
  it("returns empty for empty input", () => {
    expect(computeHeatmapLayout([], 1000)).toEqual([]);
  });

  it("returns empty when total cap is 0", () => {
    const z: SectorData[] = [{ sector: "X", marketCap: 0, changePercent: 0, tickerCount: 0 }];
    expect(computeHeatmapLayout(z, 1000)).toEqual([]);
  });

  it("areas sum to totalArea", () => {
    const layout = computeHeatmapLayout(SECTORS, 10000);
    const sum = layout.reduce((s, l) => s + l.area, 0);
    expect(sum).toBeCloseTo(10000, 1);
  });

  it("is sorted by descending area", () => {
    const layout = computeHeatmapLayout(SECTORS, 10000);
    for (let i = 1; i < layout.length; i++) {
      expect(layout[i - 1].area).toBeGreaterThanOrEqual(layout[i].area);
    }
  });

  it("proportional to marketCap", () => {
    const layout = computeHeatmapLayout(SECTORS, 1000);
    expect(layout[0].sector).toBe("Technology");
    expect(layout[0].area).toBe(500); // 500/1000 * 1000
  });
});

describe("changeColor", () => {
  it("strong up for >= 2%", () => expect(changeColor(3)).toBe("heatmap-strong-up"));
  it("up for >= 0.5%", () => expect(changeColor(1)).toBe("heatmap-up"));
  it("flat for near zero", () => expect(changeColor(0)).toBe("heatmap-flat"));
  it("down for < -0.5%", () => expect(changeColor(-1)).toBe("heatmap-down"));
  it("strong down for <= -2%", () => expect(changeColor(-3)).toBe("heatmap-strong-down"));
});

describe("renderHeatmap", () => {
  let container: HTMLElement;
  beforeEach(() => {
    container = document.createElement("div");
  });

  it("renders tiles for each sector", () => {
    renderHeatmap(container, SECTORS);
    const tiles = container.querySelectorAll(".heatmap-tile");
    expect(tiles.length).toBe(3);
  });

  it("shows empty state for no data", () => {
    renderHeatmap(container, []);
    expect(container.textContent).toContain("No sector data");
  });

  it("shows sector count", () => {
    renderHeatmap(container, SECTORS);
    expect(container.textContent).toContain("3 sectors");
  });

  it("includes aria labels", () => {
    renderHeatmap(container, SECTORS);
    const grid = container.querySelector(".heatmap-grid");
    expect(grid?.getAttribute("aria-label")).toBe("Sector Heatmap");
  });

  it("applies correct color class", () => {
    renderHeatmap(container, SECTORS);
    const tiles = container.querySelectorAll(".heatmap-tile");
    // Energy +2.5% → strong-up, Tech +1.2% → up, Healthcare -0.8% → down
    // Sorted by area: Tech, Healthcare, Energy
    expect(tiles[0].classList.contains("heatmap-up")).toBe(true); // Tech
    expect(tiles[1].classList.contains("heatmap-down")).toBe(true); // Healthcare
    expect(tiles[2].classList.contains("heatmap-strong-up")).toBe(true); // Energy
  });

  it("escapes HTML in sector names", () => {
    const xss: SectorData[] = [
      { sector: "<script>alert(1)</script>", marketCap: 100, changePercent: 0, tickerCount: 1 },
    ];
    renderHeatmap(container, xss);
    expect(container.innerHTML).not.toContain("<script>");
    expect(container.innerHTML).toContain("&lt;script&gt;");
  });
});

// ── G21: Drill-down helpers ────────────────────────────────────────────────

const STOCKS: ConstituentStock[] = [
  { ticker: "AAPL", name: "Apple Inc.", price: 200, changePercent: 2.5, weight: 0.30 },
  { ticker: "MSFT", name: "Microsoft", price: 400, changePercent: 1.0, weight: 0.25 },
  { ticker: "NVDA", name: "NVIDIA", price: 900, changePercent: 4.0, weight: 0.15 },
];

const SECTOR_WITH_STOCKS: SectorDataWithConstituents = {
  sector: "Technology", marketCap: 14_200, changePercent: 1.2, tickerCount: 3,
  constituents: STOCKS,
};

describe("absoluteMove", () => {
  it("computes |changePercent * price * weight|", () => {
    const stock = STOCKS[0]!;
    expect(absoluteMove(stock)).toBeCloseTo(2.5 * 200 * 0.30);
  });
});

describe("sortConstituents", () => {
  it("sorts by |changePercent| descending", () => {
    const sorted = sortConstituents(STOCKS, "changePercent");
    expect(sorted[0]!.ticker).toBe("NVDA"); // 4.0 > 2.5 > 1.0
    expect(sorted[1]!.ticker).toBe("AAPL");
  });

  it("sorts by weight descending", () => {
    const sorted = sortConstituents(STOCKS, "weight");
    expect(sorted[0]!.ticker).toBe("AAPL"); // 0.30 > 0.25 > 0.15
  });

  it("sorts by absoluteMove descending", () => {
    const sorted = sortConstituents(STOCKS, "absoluteMove");
    // AAPL: 2.5*200*0.3=150, MSFT: 1.0*400*0.25=100, NVDA: 4.0*900*0.15=540
    expect(sorted[0]!.ticker).toBe("NVDA");
  });

  it("does not mutate the original array", () => {
    const original = [...STOCKS];
    sortConstituents(STOCKS, "changePercent");
    expect(STOCKS[0]!.ticker).toBe(original[0]!.ticker);
  });
});

describe("renderSectorDrillDown", () => {
  let container: HTMLElement;
  const mockBack = vi.fn();

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    mockBack.mockReset();
  });

  it("renders breadcrumb with sector name", () => {
    renderSectorDrillDown(container, SECTOR_WITH_STOCKS, mockBack);
    expect(container.innerHTML).toContain("Technology");
    expect(container.innerHTML).toContain("All Sectors");
  });

  it("renders a row per constituent", () => {
    renderSectorDrillDown(container, SECTOR_WITH_STOCKS, mockBack);
    const rows = container.querySelectorAll("tbody tr");
    expect(rows.length).toBe(3);
  });

  it("shows sort buttons", () => {
    renderSectorDrillDown(container, SECTOR_WITH_STOCKS, mockBack);
    expect(container.querySelectorAll(".btn-sort").length).toBe(3);
  });

  it("calls onBack when back button clicked", () => {
    renderSectorDrillDown(container, SECTOR_WITH_STOCKS, mockBack);
    (container.querySelector("#heatmap-back") as HTMLButtonElement).click();
    expect(mockBack).toHaveBeenCalledOnce();
  });

  it("re-renders on sort button click", () => {
    renderSectorDrillDown(container, SECTOR_WITH_STOCKS, mockBack);
    const weightBtn = container.querySelector<HTMLButtonElement>('[data-sort="weight"]');
    weightBtn?.click();
    // After clicking weight sort, AAPL (weight=0.30) should be first
    const firstRow = container.querySelector("tbody tr td:first-child");
    expect(firstRow?.textContent).toBe("AAPL");
  });

  it("shows empty state when no constituents", () => {
    const emptySector: SectorDataWithConstituents = {
      sector: "Energy", marketCap: 3500, changePercent: -2.3, tickerCount: 0, constituents: [],
    };
    renderSectorDrillDown(container, emptySector, mockBack);
    expect(container.innerHTML).toContain("empty-state");
  });

  it("escapes XSS in ticker names", () => {
    const xssSector: SectorDataWithConstituents = {
      sector: "Test", marketCap: 100, changePercent: 0, tickerCount: 1,
      constituents: [{ ticker: "<xss>", price: 10, changePercent: 0, weight: 1 }],
    };
    renderSectorDrillDown(container, xssSector, mockBack);
    expect(container.innerHTML).not.toContain("<xss>");
    expect(container.innerHTML).toContain("&lt;xss&gt;");
  });
});
