/**
 * Heatmap card adapter — CardModule wrapper for the sector heatmap.
 *
 * G21: Clicking a sector tile drills down into constituent stocks.
 * Shows attribution bar, breadcrumb, and sort controls.
 */
import {
  renderGlobalHeatmap,
  renderSectorDrillDown,
  type GlobalHeatmapItem,
  type HeatmapAssetClass,
  type SectorDataWithConstituents,
} from "./heatmap";
import type { CardModule } from "./registry";
import { createDelegate, type DelegateHandle } from "../ui/delegate";

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

const GLOBAL_HEATMAPS: Readonly<Record<HeatmapAssetClass, readonly GlobalHeatmapItem[]>> = {
  stocks: MOCK_SECTORS.map((sector) => ({
    symbol: sector.sector,
    name: sector.sector,
    group: "US sectors",
    weight: sector.marketCap,
    changePercent: sector.changePercent,
  })),
  fx: [
    { symbol: "EURUSD", name: "Euro / US Dollar", group: "Majors", weight: 4, changePercent: 0.24 },
    {
      symbol: "USDJPY",
      name: "US Dollar / Yen",
      group: "Majors",
      weight: 3.4,
      changePercent: -0.31,
    },
    {
      symbol: "GBPUSD",
      name: "British Pound / US Dollar",
      group: "Majors",
      weight: 2.8,
      changePercent: 0.18,
    },
    {
      symbol: "AUDUSD",
      name: "Australian Dollar / US Dollar",
      group: "Commodity FX",
      weight: 2.1,
      changePercent: -0.52,
    },
    {
      symbol: "USDCAD",
      name: "US Dollar / Canadian Dollar",
      group: "Commodity FX",
      weight: 1.9,
      changePercent: 0.41,
    },
    {
      symbol: "USDCHF",
      name: "US Dollar / Swiss Franc",
      group: "Majors",
      weight: 1.7,
      changePercent: -0.12,
    },
  ],
  futures: [
    { symbol: "ES", name: "S&P 500", group: "Equity index", weight: 4, changePercent: 0.62 },
    { symbol: "NQ", name: "Nasdaq 100", group: "Equity index", weight: 3.7, changePercent: 1.14 },
    { symbol: "YM", name: "Dow Jones", group: "Equity index", weight: 2.6, changePercent: 0.28 },
    { symbol: "CL", name: "Crude Oil", group: "Energy", weight: 2.2, changePercent: -1.34 },
    { symbol: "GC", name: "Gold", group: "Metals", weight: 2, changePercent: 0.47 },
    { symbol: "ZB", name: "US Treasury Bond", group: "Rates", weight: 1.6, changePercent: -0.22 },
  ],
  crypto: [
    { symbol: "BTC", name: "Bitcoin", group: "Large cap", weight: 5, changePercent: 2.31 },
    { symbol: "ETH", name: "Ethereum", group: "Large cap", weight: 3.8, changePercent: 1.74 },
    { symbol: "SOL", name: "Solana", group: "Layer 1", weight: 2.7, changePercent: -0.82 },
    { symbol: "BNB", name: "BNB", group: "Large cap", weight: 2.1, changePercent: 0.38 },
    { symbol: "XRP", name: "XRP", group: "Payments", weight: 1.8, changePercent: -1.23 },
    { symbol: "ADA", name: "Cardano", group: "Layer 1", weight: 1.3, changePercent: 0.66 },
  ],
};

const heatmapCard: CardModule = {
  mount(container) {
    let delegate: DelegateHandle | null = null;
    let activeClass: HeatmapAssetClass = "stocks";
    let renderedWidth = -1;
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            const width = Math.max(container.clientWidth || 600, 320);
            if (width !== renderedWidth) showOverview();
          })
        : null;

    function showOverview(): void {
      delegate?.dispose();
      const width = Math.max(container.clientWidth || 600, 320);
      renderGlobalHeatmap(container, activeClass, GLOBAL_HEATMAPS[activeClass], {
        width,
        height: width < 560 ? 360 : 420,
      });
      renderedWidth = width;

      delegate = createDelegate(
        container,
        {
          "heatmap-class": (target) => {
            activeClass = target.dataset["heatmapClass"] as HeatmapAssetClass;
            showOverview();
          },
          "heatmap-tile": (target, event) => {
            if (event.type === "keydown") {
              const keyboardEvent = event as KeyboardEvent;
              if (keyboardEvent.key !== "Enter" && keyboardEvent.key !== " ") return;
              keyboardEvent.preventDefault();
            }
            if (activeClass !== "stocks") return;
            const sectorName = target.dataset["symbol"];
            const sectorData = MOCK_SECTORS.find((s) => s.sector === sectorName);
            if (sectorData) {
              delegate?.dispose();
              delegate = renderSectorDrillDown(container, sectorData, showOverview);
            }
          },
        },
        { eventTypes: ["click", "keydown"] },
      );
    }

    showOverview();
    resizeObserver?.observe(container);
    return {
      dispose: () => {
        delegate?.dispose();
        resizeObserver?.disconnect();
      },
    };
  },
};

export default heatmapCard;
