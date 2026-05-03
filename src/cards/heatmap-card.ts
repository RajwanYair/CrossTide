/**
 * Heatmap card adapter — CardModule wrapper for the sector heatmap.
 *
 * G21: Clicking a sector tile drills down into constituent stocks.
 * Shows attribution bar, breadcrumb, and sort controls.
 */
import { renderHeatmap, renderSectorDrillDown, type SectorDataWithConstituents } from "./heatmap";
import type { CardModule } from "./registry";

// Default sector data with constituent stocks (G21)
const MOCK_SECTORS: readonly SectorDataWithConstituents[] = [
  {
    sector: "Technology",
    marketCap: 14_200,
    changePercent: 1.2,
    tickerCount: 42,
    constituents: [
      { ticker: "AAPL", name: "Apple Inc.", price: 198.5, changePercent: 1.8, weight: 0.22 },
      { ticker: "MSFT", name: "Microsoft", price: 415.2, changePercent: 1.5, weight: 0.21 },
      { ticker: "NVDA", name: "NVIDIA", price: 875.4, changePercent: 3.2, weight: 0.18 },
      { ticker: "META", name: "Meta Platforms", price: 490.1, changePercent: 0.9, weight: 0.08 },
      { ticker: "GOOGL", name: "Alphabet", price: 170.3, changePercent: 0.4, weight: 0.16 },
    ],
  },
  {
    sector: "Healthcare",
    marketCap: 7_800,
    changePercent: -0.4,
    tickerCount: 35,
    constituents: [
      { ticker: "JNJ", name: "Johnson & Johnson", price: 155.2, changePercent: -0.3, weight: 0.12 },
      { ticker: "UNH", name: "UnitedHealth", price: 520.8, changePercent: -1.1, weight: 0.15 },
      { ticker: "LLY", name: "Eli Lilly", price: 790.5, changePercent: 0.8, weight: 0.18 },
      { ticker: "MRK", name: "Merck", price: 128.7, changePercent: -0.5, weight: 0.1 },
    ],
  },
  {
    sector: "Financials",
    marketCap: 8_100,
    changePercent: 0.7,
    tickerCount: 28,
    constituents: [
      { ticker: "JPM", name: "JPMorgan Chase", price: 195.4, changePercent: 1.2, weight: 0.14 },
      { ticker: "BAC", name: "Bank of America", price: 39.2, changePercent: 0.8, weight: 0.08 },
      { ticker: "GS", name: "Goldman Sachs", price: 415.6, changePercent: 0.3, weight: 0.07 },
      {
        ticker: "BRK.B",
        name: "Berkshire Hathaway",
        price: 370.1,
        changePercent: 0.5,
        weight: 0.13,
      },
    ],
  },
  {
    sector: "Consumer Disc.",
    marketCap: 5_900,
    changePercent: -1.1,
    tickerCount: 22,
    constituents: [
      { ticker: "AMZN", name: "Amazon", price: 185.3, changePercent: -0.9, weight: 0.24 },
      { ticker: "TSLA", name: "Tesla", price: 182.6, changePercent: -3.1, weight: 0.1 },
      { ticker: "HD", name: "Home Depot", price: 340.2, changePercent: -0.6, weight: 0.09 },
    ],
  },
  {
    sector: "Industrials",
    marketCap: 5_200,
    changePercent: 0.3,
    tickerCount: 30,
    constituents: [
      { ticker: "RTX", name: "RTX Corp", price: 115.4, changePercent: 0.7, weight: 0.08 },
      { ticker: "CAT", name: "Caterpillar", price: 330.2, changePercent: 0.2, weight: 0.09 },
      { ticker: "DE", name: "Deere & Company", price: 390.5, changePercent: -0.1, weight: 0.07 },
    ],
  },
  {
    sector: "Communication",
    marketCap: 4_800,
    changePercent: 2.5,
    tickerCount: 12,
    constituents: [],
  },
  {
    sector: "Consumer Stap.",
    marketCap: 4_100,
    changePercent: -0.2,
    tickerCount: 18,
    constituents: [],
  },
  { sector: "Energy", marketCap: 3_500, changePercent: -2.3, tickerCount: 14, constituents: [] },
  { sector: "Utilities", marketCap: 1_800, changePercent: 0.1, tickerCount: 10, constituents: [] },
  {
    sector: "Real Estate",
    marketCap: 1_500,
    changePercent: -0.8,
    tickerCount: 15,
    constituents: [],
  },
  { sector: "Materials", marketCap: 1_200, changePercent: 0.6, tickerCount: 9, constituents: [] },
];

const heatmapCard: CardModule = {
  mount(container) {
    function showOverview(): void {
      renderHeatmap(container, MOCK_SECTORS, {
        width: container.clientWidth || 600,
        height: 320,
      });

      // Wire click handlers for sector drill-down (G21)
      container.querySelectorAll<HTMLElement>("[data-sector]").forEach((tile) => {
        tile.style.cursor = "pointer";
        tile.addEventListener("click", () => {
          const sectorName = tile.dataset["sector"];
          const sectorData = MOCK_SECTORS.find((s) => s.sector === sectorName);
          if (sectorData) {
            renderSectorDrillDown(container, sectorData, showOverview);
          }
        });
      });
    }

    showOverview();
    return {};
  },
};

export default heatmapCard;
