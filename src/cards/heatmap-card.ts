/**
 * Heatmap card adapter — CardModule wrapper for the sector heatmap.
 *
 * Renders a sector treemap colored by daily change %.
 * Uses mock sector data for now; will connect to provider chain in Phase B.
 */
import { renderHeatmap, type SectorData } from "./heatmap";
import type { CardModule } from "./registry";

// Default sector data (representative US equity sectors)
const MOCK_SECTORS: readonly SectorData[] = [
  { sector: "Technology", marketCap: 14_200, changePercent: 1.2, tickerCount: 42 },
  { sector: "Healthcare", marketCap: 7_800, changePercent: -0.4, tickerCount: 35 },
  { sector: "Financials", marketCap: 8_100, changePercent: 0.7, tickerCount: 28 },
  { sector: "Consumer Disc.", marketCap: 5_900, changePercent: -1.1, tickerCount: 22 },
  { sector: "Industrials", marketCap: 5_200, changePercent: 0.3, tickerCount: 30 },
  { sector: "Communication", marketCap: 4_800, changePercent: 2.5, tickerCount: 12 },
  { sector: "Consumer Stap.", marketCap: 4_100, changePercent: -0.2, tickerCount: 18 },
  { sector: "Energy", marketCap: 3_500, changePercent: -2.3, tickerCount: 14 },
  { sector: "Utilities", marketCap: 1_800, changePercent: 0.1, tickerCount: 10 },
  { sector: "Real Estate", marketCap: 1_500, changePercent: -0.8, tickerCount: 15 },
  { sector: "Materials", marketCap: 1_200, changePercent: 0.6, tickerCount: 9 },
];

const heatmapCard: CardModule = {
  mount(container) {
    renderHeatmap(container, MOCK_SECTORS, {
      width: container.clientWidth || 600,
      height: 320,
    });
    return {};
  },
};

export default heatmapCard;
