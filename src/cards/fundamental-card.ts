/**
 * Fundamental data card (Q1) — displays key financial metrics for a ticker.
 *
 * Uses <ct-stat-grid> and <ct-empty-state> Web Components for rendering.
 * Fetches from /api/fundamentals/:symbol endpoint.
 */
import type { CardModule } from "./registry";
import type { StatItem, CtStatGrid } from "../ui/stat-grid";
import "../ui/stat-grid";
import "../ui/empty-state";

interface FundamentalData {
  symbol: string;
  shortName: string;
  sector: string;
  industry: string;
  marketCap: number;
  trailingPE: number;
  forwardPE: number;
  pegRatio: number;
  priceToBook: number;
  eps: number;
  revenue: number;
  revenueGrowth: number;
  grossMargin: number;
  operatingMargin: number;
  profitMargin: number;
  returnOnEquity: number;
  debtToEquity: number;
  dividendYield: number;
  beta: number;
}

async function fetchFundamentals(symbol: string): Promise<FundamentalData | null> {
  try {
    const res = await fetch(`/api/fundamentals/${encodeURIComponent(symbol)}`);
    if (!res.ok) return null;
    return (await res.json()) as FundamentalData;
  } catch {
    return null;
  }
}

function formatLargeNumber(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString()}`;
}

function formatPercent(n: number): string {
  return `${(n * 100).toFixed(2)}%`;
}

function formatRatio(n: number): string {
  return n === 0 ? "N/A" : n.toFixed(2);
}

function buildStats(data: FundamentalData): StatItem[] {
  return [
    { label: "Market Cap", value: formatLargeNumber(data.marketCap) },
    { label: "P/E (TTM)", value: formatRatio(data.trailingPE) },
    { label: "P/E (Fwd)", value: formatRatio(data.forwardPE) },
    { label: "PEG Ratio", value: formatRatio(data.pegRatio) },
    { label: "P/B Ratio", value: formatRatio(data.priceToBook) },
    { label: "EPS", value: data.eps ? `$${data.eps.toFixed(2)}` : "N/A" },
    { label: "Revenue", value: formatLargeNumber(data.revenue) },
    {
      label: "Rev Growth",
      value: formatPercent(data.revenueGrowth),
      trend: data.revenueGrowth > 0 ? "up" : data.revenueGrowth < 0 ? "down" : undefined,
    },
    { label: "Gross Margin", value: formatPercent(data.grossMargin) },
    { label: "Op Margin", value: formatPercent(data.operatingMargin) },
    { label: "Net Margin", value: formatPercent(data.profitMargin) },
    {
      label: "ROE",
      value: formatPercent(data.returnOnEquity),
      trend: data.returnOnEquity > 0.15 ? "up" : data.returnOnEquity < 0 ? "down" : undefined,
    },
    { label: "D/E Ratio", value: formatRatio(data.debtToEquity) },
    { label: "Div Yield", value: data.dividendYield ? formatPercent(data.dividendYield) : "N/A" },
    { label: "Beta", value: data.beta ? data.beta.toFixed(2) : "N/A" },
    { label: "Sector", value: data.sector || "N/A" },
  ];
}

function render(container: HTMLElement, symbol: string): void {
  if (!symbol) {
    container.innerHTML = `<ct-empty-state variant="empty" title="No ticker selected" description="Select a ticker to view fundamentals"></ct-empty-state>`;
    return;
  }

  container.innerHTML = `<ct-empty-state variant="loading" title="Loading fundamentals…"></ct-empty-state>`;

  void fetchFundamentals(symbol).then((data) => {
    if (!data) {
      container.innerHTML = `<ct-empty-state variant="error" title="Failed to load" description="Could not fetch fundamental data for ${symbol}"></ct-empty-state>`;
      return;
    }

    const header = `<div class="fundamental-header"><h2>${data.shortName}</h2><span class="fundamental-industry">${data.industry}</span></div>`;
    container.innerHTML = header;

    const grid = document.createElement("ct-stat-grid") as CtStatGrid;
    grid.stats = buildStats(data);
    grid.options = { ariaLabel: `${symbol} fundamentals`, minColumnWidth: "150px" };
    container.appendChild(grid);
  });
}

const fundamentalCard: CardModule = {
  mount(container, ctx) {
    const symbol = ctx.params["symbol"] ?? "";
    render(container, symbol);
    return {
      update(newCtx): void {
        render(container, newCtx.params["symbol"] ?? "");
      },
    };
  },
};

export default fundamentalCard;
