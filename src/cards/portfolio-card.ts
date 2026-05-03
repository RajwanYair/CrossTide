/**
 * Portfolio card — displays position metrics, sector allocation,
 * and P/L summary. Reads holdings from IDB (portfolio-store);
 * falls back to demo data when user has no persisted positions.
 */
import {
  positionMetrics,
  sectorAllocation,
  totalValue,
  topConcentration,
  type Holding,
} from "../domain/portfolio-analytics";
import { loadHoldings } from "./portfolio-store";
import type { CardModule } from "./registry";
import { patchDOM } from "../core/patch-dom";

// ── Demo holdings (shown when IDB is empty / first visit) ────────────────────
const DEMO_HOLDINGS: readonly Holding[] = [
  { ticker: "AAPL", sector: "Technology", quantity: 50, avgCost: 150.0, currentPrice: 189.3 },
  { ticker: "MSFT", sector: "Technology", quantity: 30, avgCost: 290.0, currentPrice: 374.51 },
  { ticker: "NVDA", sector: "Technology", quantity: 20, avgCost: 450.0, currentPrice: 875.0 },
  { ticker: "JPM", sector: "Financials", quantity: 40, avgCost: 130.0, currentPrice: 198.5 },
  { ticker: "BAC", sector: "Financials", quantity: 100, avgCost: 28.0, currentPrice: 36.2 },
  { ticker: "XOM", sector: "Energy", quantity: 60, avgCost: 80.0, currentPrice: 112.4 },
  { ticker: "JNJ", sector: "Healthcare", quantity: 25, avgCost: 160.0, currentPrice: 152.0 },
  { ticker: "PG", sector: "Consumer Staples", quantity: 35, avgCost: 140.0, currentPrice: 165.8 },
];

function fmt(n: number, decimals = 2): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtPct(n: number): string {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${fmt(n * 100, 1)}%`;
}

function fmtCurrency(n: number): string {
  return "$" + fmt(n);
}

function badgeClass(n: number): string {
  if (n > 0) return "badge badge-positive";
  if (n < 0) return "badge badge-negative";
  return "badge badge-neutral";
}

function renderPortfolio(container: HTMLElement, holdings: readonly Holding[]): void {
  const total = totalValue(holdings);
  const metrics = positionMetrics(holdings).sort((a, b) => b.value - a.value);
  const sectors = sectorAllocation(holdings);
  const top3 = topConcentration(holdings, 3);

  const totalPnl = metrics.reduce((s, m) => s + m.unrealizedPnl, 0);
  const totalCost = holdings.reduce((s, h) => s + h.quantity * h.avgCost, 0);
  const totalReturnPct = totalCost === 0 ? 0 : totalPnl / totalCost;

  patchDOM(
    container,
    `
    <div class="portfolio-layout">

      <!-- ── Summary row ── -->
      <div class="portfolio-summary-row">
        <div class="portfolio-summary-stat">
          <span class="stat-label">Total Value</span>
          <span class="stat-value">${fmtCurrency(total)}</span>
        </div>
        <div class="portfolio-summary-stat">
          <span class="stat-label">Unrealized P/L</span>
          <span class="stat-value ${totalPnl >= 0 ? "text-positive" : "text-negative"}">
            ${fmtCurrency(totalPnl)}
            <span class="${badgeClass(totalReturnPct)}">${fmtPct(totalReturnPct)}</span>
          </span>
        </div>
        <div class="portfolio-summary-stat">
          <span class="stat-label">Positions</span>
          <span class="stat-value">${holdings.length}</span>
        </div>
        <div class="portfolio-summary-stat">
          <span class="stat-label">Top-3 Concentration</span>
          <span class="stat-value">${fmt(top3 * 100, 1)}%</span>
        </div>
      </div>

      <!-- ── Two-column layout ── -->
      <div class="portfolio-columns">

        <!-- Position table -->
        <div class="portfolio-col">
          <h3 class="section-subtitle">Positions</h3>
          <div style="overflow-x:auto">
            <table class="data-table portfolio-table">
              <thead>
                <tr>
                  <th scope="col">Ticker</th>
                  <th scope="col">Sector</th>
                  <th scope="col" class="num">Value</th>
                  <th scope="col" class="num">Weight</th>
                  <th scope="col" class="num">P/L</th>
                  <th scope="col" class="num">Return</th>
                </tr>
              </thead>
              <tbody>
                ${metrics
                  .map((m) => {
                    const h = holdings.find((x) => x.ticker === m.ticker)!;
                    return `<tr>
                      <td><strong>${m.ticker}</strong></td>
                      <td class="text-muted">${h.sector ?? "—"}</td>
                      <td class="num">${fmtCurrency(m.value)}</td>
                      <td class="num">${fmt(m.weight * 100, 1)}%</td>
                      <td class="num">
                        <span class="${badgeClass(m.unrealizedPnl)}">${fmtCurrency(m.unrealizedPnl)}</span>
                      </td>
                      <td class="num">
                        <span class="${badgeClass(m.unrealizedReturnPct)}">${fmtPct(m.unrealizedReturnPct)}</span>
                      </td>
                    </tr>`;
                  })
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Sector allocation -->
        <div class="portfolio-col">
          <h3 class="section-subtitle">Sector Allocation</h3>
          <div class="sector-allocation-list">
            ${sectors
              .map((s) => {
                const pct = fmt(s.weight * 100, 1);
                return `
                <div class="sector-row">
                  <div class="sector-meta">
                    <span class="sector-name">${s.sector}</span>
                    <span class="sector-tickers text-muted">${s.tickers} ticker${s.tickers > 1 ? "s" : ""}</span>
                  </div>
                  <div class="sector-bar-wrap">
                    <div class="sector-bar-fill" style="width:${Math.min(s.weight * 100, 100)}%"></div>
                  </div>
                  <span class="sector-pct">${pct}%</span>
                </div>`;
              })
              .join("")}
          </div>
        </div>

      </div><!-- /portfolio-columns -->

      <p class="empty-state portfolio-demo-note">
        ${holdings === DEMO_HOLDINGS ? "Demo data — import your holdings via Settings → Portfolio." : `${holdings.length} position${holdings.length > 1 ? "s" : ""} from your saved portfolio.`}
      </p>

    </div><!-- /portfolio-layout -->
  `,
  );
}

const portfolioCard: CardModule = {
  mount(container, _ctx) {
    // Load user holdings from IDB; fall back to demo if empty
    void loadHoldings().then((persisted) => {
      const holdings: readonly Holding[] = persisted.length > 0 ? persisted : DEMO_HOLDINGS;
      renderPortfolio(container, holdings);
    });
    // Render demo immediately while IDB loads (avoids blank flash)
    renderPortfolio(container, DEMO_HOLDINGS);
    return {};
  },
};

export default portfolioCard;
