/**
 * Earnings Calendar card (H18).
 *
 * For now this card uses deterministic mock scheduling per watchlist ticker
 * so UI and workflow are in place. Data source hook is isolated so we can
 * swap in Finnhub /calendar/earnings without changing rendering logic.
 */
import { loadConfig } from "../core/config";
import type { CardModule } from "./registry";

export interface EarningsEvent {
  ticker: string;
  companyName: string;
  earningsDate: string; // ISO YYYY-MM-DD
  epsEstimate: number;
  priorEps: number;
  surprisePct: number;
}

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) % 10000;
}

function formatDateISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function isWithinDays(isoDate: string, days: number, now = new Date()): boolean {
  const target = new Date(isoDate + "T00:00:00Z").getTime();
  const start = new Date(now.toISOString().slice(0, 10) + "T00:00:00Z").getTime();
  const diffDays = (target - start) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= days;
}

export function buildMockEarningsEvents(): EarningsEvent[] {
  const cfg = loadConfig();
  const today = new Date();
  return cfg.watchlist
    .map((w) => {
      const seed = hashSeed(w.ticker);
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() + (seed % 30) + 1);
      const epsEstimate = (seed % 500) / 100 - 1;
      const priorEps = ((seed * 7) % 500) / 100 - 1;
      const surprisePct = (seed % 400) / 10 - 20;
      return {
        ticker: w.ticker,
        companyName: w.name ?? w.ticker,
        earningsDate: formatDateISO(d),
        epsEstimate,
        priorEps,
        surprisePct,
      };
    })
    .sort((a, b) => a.earningsDate.localeCompare(b.earningsDate));
}

function fmt(n: number): string {
  return n >= 0 ? `+${n.toFixed(2)}` : n.toFixed(2);
}

export function renderEarningsCalendar(
  container: HTMLElement,
  events: readonly EarningsEvent[],
): void {
  if (events.length === 0) {
    container.innerHTML = `<div class="card"><div class="card-body"><p class="empty-state">No watchlist tickers to schedule.</p></div></div>`;
    return;
  }

  const rows = events
    .map((e) => {
      const imminent = isWithinDays(e.earningsDate, 7);
      return `<tr${imminent ? ' class="earnings-imminent"' : ""}>
      <td class="font-mono">${e.ticker}</td>
      <td>${escapeHtml(e.companyName)}</td>
      <td class="font-mono">${e.earningsDate}</td>
      <td class="font-mono">${fmt(e.epsEstimate)}</td>
      <td class="font-mono">${fmt(e.priorEps)}</td>
      <td class="font-mono ${e.surprisePct >= 0 ? "up" : "dn"}">${fmt(e.surprisePct)}%</td>
    </tr>`;
    })
    .join("");

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h2>Earnings Calendar</h2>
        <span class="text-secondary">Upcoming 30 days</span>
      </div>
      <div class="card-body">
        <table class="earnings-table">
          <thead>
            <tr><th>Ticker</th><th>Company</th><th>Date</th><th>EPS Est.</th><th>Prior EPS</th><th>Surprise %</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const earningsCalendarCard: CardModule = {
  mount(container) {
    renderEarningsCalendar(container, buildMockEarningsEvents());
    return {};
  },
};

export default earningsCalendarCard;
