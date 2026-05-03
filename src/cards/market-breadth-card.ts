/**
 * Market Breadth card (G23) — watchlist-aggregate signal health at a glance.
 *
 * Panels:
 *   (a) BUY / NEUTRAL / SELL donut (count from latest consensus results)
 *   (b) % of watchlist with close above 50-day SMA and 200-day SMA
 *   (c) Advance / Decline bar (gainers vs losers, current session)
 *   (d) Top 3 movers + laggards
 *
 * No new API calls — reads data from the market-breadth-data bridge,
 * populated by main.ts after every data refresh cycle.
 */
import { getBreadthData, type BreadthEntry } from "./market-breadth-data";
import type { CardModule } from "./registry";

// ── Pure computation helpers ───────────────────────────────────────────────

export interface BreadthSummary {
  buyCount: number;
  neutralCount: number;
  sellCount: number;
  aboveSma50Pct: number | null; // 0-1
  aboveSma200Pct: number | null; // 0-1
  advancers: number;
  decliners: number;
  unchanged: number;
  topMovers: readonly BreadthEntry[]; // sorted desc by changePercent
  topLaggards: readonly BreadthEntry[]; // sorted asc by changePercent
}

export function computeBreadthSummary(entries: readonly BreadthEntry[]): BreadthSummary {
  let buyCount = 0;
  let neutralCount = 0;
  let sellCount = 0;
  let advancers = 0;
  let decliners = 0;
  let unchanged = 0;
  let sma50Eligible = 0;
  let sma50Above = 0;
  let sma200Eligible = 0;
  let sma200Above = 0;

  for (const e of entries) {
    if (e.consensus === "BUY") buyCount++;
    else if (e.consensus === "SELL") sellCount++;
    else neutralCount++;

    if (e.changePercent > 0.05) advancers++;
    else if (e.changePercent < -0.05) decliners++;
    else unchanged++;

    if (e.aboveSma50 !== null) {
      sma50Eligible++;
      if (e.aboveSma50) sma50Above++;
    }
    if (e.aboveSma200 !== null) {
      sma200Eligible++;
      if (e.aboveSma200) sma200Above++;
    }
  }

  const sorted = [...entries].sort((a, b) => b.changePercent - a.changePercent);
  return {
    buyCount,
    neutralCount,
    sellCount,
    advancers,
    decliners,
    unchanged,
    aboveSma50Pct: sma50Eligible > 0 ? sma50Above / sma50Eligible : null,
    aboveSma200Pct: sma200Eligible > 0 ? sma200Above / sma200Eligible : null,
    topMovers: sorted.slice(0, 3),
    topLaggards: sorted.slice(-3).reverse(),
  };
}

// ── Rendering helpers ──────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function pct(n: number): string {
  return (n * 100).toFixed(1) + "%";
}

function signedPct(n: number): string {
  const s = (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
  return s;
}

/** Render an SVG donut chart (radius 48, viewBox 100×100). */
export function renderDonut(buy: number, neutral: number, sell: number): string {
  const total = buy + neutral + sell;
  if (total === 0)
    return `<svg class="breadth-donut" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="38" fill="none" stroke="var(--border)" stroke-width="14"/></svg>`;

  const cx = 50;
  const cy = 50;
  const r = 38;
  const circumference = 2 * Math.PI * r;

  const slices: Array<{ value: number; color: string; label: string }> = [
    { value: buy, color: "var(--success)", label: "BUY" },
    { value: neutral, color: "var(--text-secondary)", label: "NEUTRAL" },
    { value: sell, color: "var(--danger)", label: "SELL" },
  ];

  let offset = 0;
  const paths = slices
    .filter((s) => s.value > 0)
    .map((s) => {
      const dash = (s.value / total) * circumference;
      const gap = circumference - dash;
      const el = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.color}" stroke-width="14" stroke-dasharray="${dash.toFixed(2)} ${gap.toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 50 50)"><title>${esc(s.label)}: ${s.value}</title></circle>`;
      offset += dash;
      return el;
    })
    .join("");

  return `<svg class="breadth-donut" viewBox="0 0 100 100" aria-label="Signal distribution donut">${paths}</svg>`;
}

/** Render a horizontal bar showing advance/decline ratio. */
export function renderADBar(advancers: number, unchanged: number, decliners: number): string {
  const total = advancers + unchanged + decliners;
  if (total === 0)
    return `<div class="breadth-ad-bar"><span class="empty-state">No data</span></div>`;

  const aPct = ((advancers / total) * 100).toFixed(1);
  const uPct = ((unchanged / total) * 100).toFixed(1);
  const dPct = ((decliners / total) * 100).toFixed(1);

  return `<div class="breadth-ad-bar" title="Advance/Decline: ${advancers} / ${unchanged} / ${decliners}">
    <div class="breadth-ad-segment breadth-ad-up" style="width:${aPct}%" aria-label="Advancers ${aPct}%"></div>
    <div class="breadth-ad-segment breadth-ad-flat" style="width:${uPct}%" aria-label="Unchanged ${uPct}%"></div>
    <div class="breadth-ad-segment breadth-ad-down" style="width:${dPct}%" aria-label="Decliners ${dPct}%"></div>
  </div>
  <div class="breadth-ad-legend">
    <span class="up">▲ ${advancers}</span>
    <span class="flat">─ ${unchanged}</span>
    <span class="dn">▼ ${decliners}</span>
  </div>`;
}

function renderMoverRow(e: BreadthEntry): string {
  const cls = e.changePercent >= 0 ? "up" : "dn";
  return `<tr>
    <td class="font-mono">${esc(e.ticker)}</td>
    <td class="font-mono">$${e.price.toFixed(2)}</td>
    <td class="font-mono ${cls}">${signedPct(e.changePercent)}</td>
    <td><span class="badge badge-${e.consensus.toLowerCase()}">${esc(e.consensus)}</span></td>
  </tr>`;
}

// ── Main render ────────────────────────────────────────────────────────────

export function renderMarketBreadth(
  container: HTMLElement,
  entries: readonly BreadthEntry[],
): void {
  if (entries.length === 0) {
    container.innerHTML = `<div class="card"><div class="card-body"><p class="empty-state">No data yet — wait for the watchlist to load.</p></div></div>`;
    return;
  }

  const s = computeBreadthSummary(entries);
  const total = s.buyCount + s.neutralCount + s.sellCount;

  const donut = renderDonut(s.buyCount, s.neutralCount, s.sellCount);

  const smaBars = `
    <div class="breadth-sma-row">
      <span>Above SMA 50</span>
      <div class="breadth-sma-bar">
        <div class="breadth-sma-fill" style="width:${s.aboveSma50Pct !== null ? pct(s.aboveSma50Pct) : "0%"}" title="${s.aboveSma50Pct !== null ? pct(s.aboveSma50Pct) : "N/A"}"></div>
      </div>
      <span class="font-mono">${s.aboveSma50Pct !== null ? pct(s.aboveSma50Pct) : "N/A"}</span>
    </div>
    <div class="breadth-sma-row">
      <span>Above SMA 200</span>
      <div class="breadth-sma-bar">
        <div class="breadth-sma-fill" style="width:${s.aboveSma200Pct !== null ? pct(s.aboveSma200Pct) : "0%"}" title="${s.aboveSma200Pct !== null ? pct(s.aboveSma200Pct) : "N/A"}"></div>
      </div>
      <span class="font-mono">${s.aboveSma200Pct !== null ? pct(s.aboveSma200Pct) : "N/A"}</span>
    </div>`;

  const adBar = renderADBar(s.advancers, s.unchanged, s.decliners);

  const moversTable = [...s.topMovers].map(renderMoverRow).join("");
  const laggardsTable = [...s.topLaggards].map(renderMoverRow).join("");

  container.innerHTML = `
  <div class="card">
    <div class="card-header"><h2>Market Breadth</h2></div>
    <div class="card-body">

      <div class="breadth-grid">

        <!-- (a) Signal distribution donut -->
        <section class="breadth-panel" aria-label="Signal distribution">
          <h3 class="breadth-panel-title">Signal Distribution</h3>
          <div class="breadth-donut-wrap">
            ${donut}
            <div class="breadth-donut-legend">
              <span class="up">BUY ${s.buyCount}</span>
              <span class="flat">NEUTRAL ${s.neutralCount}</span>
              <span class="dn">SELL ${s.sellCount}</span>
              <span class="text-secondary">/ ${total}</span>
            </div>
          </div>
        </section>

        <!-- (b) % above SMA 50 / 200 -->
        <section class="breadth-panel" aria-label="Moving average health">
          <h3 class="breadth-panel-title">MA Health</h3>
          ${smaBars}
        </section>

        <!-- (c) Advance / Decline -->
        <section class="breadth-panel" aria-label="Advance decline">
          <h3 class="breadth-panel-title">Advance / Decline</h3>
          ${adBar}
        </section>

      </div>

      <!-- (d) Movers & Laggards -->
      <div class="breadth-movers-grid">
        <section aria-label="Top movers">
          <h3 class="breadth-panel-title">Top Movers</h3>
          <table class="breadth-movers-table">
            <tbody>${moversTable}</tbody>
          </table>
        </section>
        <section aria-label="Top laggards">
          <h3 class="breadth-panel-title">Top Laggards</h3>
          <table class="breadth-movers-table">
            <tbody>${laggardsTable}</tbody>
          </table>
        </section>
      </div>

    </div>
  </div>`;
}

// ── Card module ─────────────────────────────────────────────────────────────

const marketBreadthCard: CardModule = {
  mount(container) {
    renderMarketBreadth(container, getBreadthData());
    return {};
  },
};

export default marketBreadthCard;
