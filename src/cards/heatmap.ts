/**
 * Sector Heatmap Card — renders sector treemap colored by % change.
 *
 * Pure DOM rendering — no canvas (testable in happy-dom).
 * Consumer supplies sector data from provider chain.
 */

export interface SectorData {
  readonly sector: string;
  readonly marketCap: number; // total cap in $B
  readonly changePercent: number; // e.g. 1.5 = +1.5%
  readonly tickerCount: number;
}

import { patchDOM } from "../core/patch-dom";
import { createDelegate, type DelegateHandle } from "../ui/delegate";

/** G21: A single constituent stock within a sector. */
export interface ConstituentStock {
  readonly ticker: string;
  readonly name?: string;
  readonly price: number;
  readonly changePercent: number;
  /** Market-cap proxy weight in the sector (0–1, sums to 1 across constituents). */
  readonly weight: number;
}

/** G21: SectorData extended with optional constituent breakdown. */
export interface SectorDataWithConstituents extends SectorData {
  readonly constituents?: readonly ConstituentStock[];
}

export type SortKey = "changePercent" | "weight" | "absoluteMove";

export interface HeatmapOptions {
  readonly width?: number;
  readonly height?: number;
}

/**
 * Normalize sector sizes to proportional areas that sum to `totalArea`.
 * Returns array of { sector, area, changePercent } sorted by descending area.
 */
export function computeHeatmapLayout(
  sectors: readonly SectorData[],
  totalArea: number,
): { sector: string; area: number; changePercent: number }[] {
  const totalCap = sectors.reduce((s, d) => s + d.marketCap, 0);
  if (totalCap <= 0) return [];

  return sectors
    .map((d) => ({
      sector: d.sector,
      area: (d.marketCap / totalCap) * totalArea,
      changePercent: d.changePercent,
    }))
    .sort((a, b) => b.area - a.area);
}

/**
 * Map a change% to a CSS color class.
 */
export function changeColor(pct: number): string {
  if (pct >= 2) return "heatmap-strong-up";
  if (pct >= 0.5) return "heatmap-up";
  if (pct > -0.5) return "heatmap-flat";
  if (pct > -2) return "heatmap-down";
  return "heatmap-strong-down";
}

/**
 * Render the sector heatmap into a container.
 */
export function renderHeatmap(
  container: HTMLElement,
  sectors: readonly SectorData[],
  options?: HeatmapOptions,
): void {
  if (sectors.length === 0) {
    patchDOM(container, `<p class="empty-state">No sector data available.</p>`);
    return;
  }

  const width = options?.width ?? 600;
  const height = options?.height ?? 400;
  const totalArea = width * height;
  const layout = computeHeatmapLayout(sectors, totalArea);

  // Simple row-based strip layout (squarified treemap is overkill for DOM)
  const tiles = layout.map((item) => {
    const tileWidth = Math.max(40, (item.area / height) | 0);
    const sign = item.changePercent >= 0 ? "+" : "";
    return `<div class="heatmap-tile ${changeColor(item.changePercent)}"
      style="width:${tileWidth}px;height:${height}px;flex-shrink:1"
      role="img" aria-label="${escapeAttr(item.sector)} ${sign}${item.changePercent.toFixed(1)}%"
      data-sector="${escapeAttr(item.sector)}">
      <span class="heatmap-label">${escapeHtml(item.sector)}</span>
      <span class="heatmap-pct">${sign}${item.changePercent.toFixed(1)}%</span>
    </div>`;
  });

  patchDOM(
    container,
    `
    <div class="heatmap-grid" role="img" aria-label="Sector Heatmap"
         style="display:flex;width:${width}px;height:${height}px;overflow:hidden">
      ${tiles.join("")}
    </div>
    <p class="text-secondary">${sectors.length} sectors</p>
  `,
  );
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(s: string): string {
  // Strip < and > from raw input first: when innerHTML re-serializes,
  // attribute values are not entity-encoded for <>, so &lt;/&gt; would
  // decode back to < / > and re-introduce the tag-like substring.
  return escapeHtml(s.replace(/[<>]/g, "")).replace(/"/g, "&quot;");
}

/**
 * G21: Compute absolute price move proxy (changePercent × price × weight).
 * Used for "absolute move" sort and attribution bar.
 */
export function absoluteMove(stock: ConstituentStock): number {
  return Math.abs(stock.changePercent * stock.price * stock.weight);
}

/**
 * G21: Sort constituent stocks by the given key.
 */
export function sortConstituents(
  stocks: readonly ConstituentStock[],
  key: SortKey,
): ConstituentStock[] {
  return [...stocks].sort((a, b) => {
    switch (key) {
      case "changePercent":
        return Math.abs(b.changePercent) - Math.abs(a.changePercent);
      case "weight":
        return b.weight - a.weight;
      case "absoluteMove":
        return absoluteMove(b) - absoluteMove(a);
    }
  });
}

/**
 * G21: Render the sector drill-down view.
 * Shows constituent stocks with attribution bar and sort controls.
 */
export function renderSectorDrillDown(
  container: HTMLElement,
  sector: SectorDataWithConstituents,
  onBack: () => void,
  sortKey: SortKey = "changePercent",
): DelegateHandle {
  const stocks = sector.constituents ?? [];

  if (stocks.length === 0) {
    patchDOM(
      container,
      `
      <div class="heatmap-breadcrumb">
        <button class="btn-link" data-action="heatmap-back">← All Sectors</button>
        <span class="breadcrumb-sep">›</span>
        <span>${escapeHtml(sector.sector)}</span>
      </div>
      <p class="empty-state">No constituent data available for ${escapeHtml(sector.sector)}.</p>`,
    );
    return createDelegate(container, { "heatmap-back": onBack });
  }

  const sorted = sortConstituents(stocks, sortKey);
  const maxMove = Math.max(...sorted.map(absoluteMove), 0.001);

  const rows = sorted
    .map((s) => {
      const move = absoluteMove(s);
      const barPct = ((move / maxMove) * 100).toFixed(1);
      const sign = s.changePercent >= 0 ? "+" : "";
      const cls = s.changePercent >= 0 ? "up" : "dn";
      return `<tr>
      <td class="font-mono">${escapeHtml(s.ticker)}</td>
      <td>${s.name ? escapeHtml(s.name) : ""}</td>
      <td class="font-mono">$${s.price.toFixed(2)}</td>
      <td class="font-mono ${cls}">${sign}${s.changePercent.toFixed(2)}%</td>
      <td class="font-mono text-secondary">${(s.weight * 100).toFixed(1)}%</td>
      <td class="heatmap-attr-cell">
        <div class="heatmap-attr-bar" style="width:${barPct}%"></div>
      </td>
    </tr>`;
    })
    .join("");

  const activeSortClass = (k: SortKey): string => (k === sortKey ? " sort-active" : "");

  patchDOM(
    container,
    `
    <div class="heatmap-breadcrumb">
      <button class="btn-link" data-action="heatmap-back">← All Sectors</button>
      <span class="breadcrumb-sep">›</span>
      <span>${escapeHtml(sector.sector)}</span>
      <span class="text-secondary">(${stocks.length} stocks)</span>
    </div>
    <div class="heatmap-sort-bar">
      Sort:
      <button class="btn-sort${activeSortClass("changePercent")}" data-action="sort-drill" data-sort="changePercent">% Change</button>
      <button class="btn-sort${activeSortClass("weight")}" data-action="sort-drill" data-sort="weight">Weight</button>
      <button class="btn-sort${activeSortClass("absoluteMove")}" data-action="sort-drill" data-sort="absoluteMove">Abs Move</button>
    </div>
    <div class="card">
      <table class="heatmap-drill-table">
        <thead>
          <tr>
            <th>Ticker</th><th>Name</th><th>Price</th><th>Change</th><th>Weight</th>
            <th>Attribution</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`,
  );

  return createDelegate(container, {
    "heatmap-back": onBack,
    "sort-drill": (target) => {
      const key = target.dataset["sort"] as SortKey;
      renderSectorDrillDown(container, sector, onBack, key);
    },
  });
}
