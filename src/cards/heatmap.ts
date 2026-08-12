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
import type { ConstituentStock } from "../types/domain";
import { computeHeatmap } from "./heatmap-layout";

export type { ConstituentStock };

/** G21: SectorData extended with optional constituent breakdown. */
export interface SectorDataWithConstituents extends SectorData {
  readonly constituents?: readonly ConstituentStock[];
}

export type SortKey = "changePercent" | "weight" | "absoluteMove";

export interface HeatmapOptions {
  readonly width?: number;
  readonly height?: number;
}

/** Global heatmap asset classes supported by the overview selector. */
export type HeatmapAssetClass = "stocks" | "fx" | "futures" | "crypto";

/** A top-level tile used by the global heatmap overview. */
export interface GlobalHeatmapItem {
  readonly symbol: string;
  readonly name: string;
  readonly group: string;
  readonly weight: number;
  readonly changePercent: number;
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
  const layout = computeHeatmap(
    sectors.map((sector) => ({
      ticker: sector.sector,
      weight: sector.marketCap,
      changePct: sector.changePercent,
    })),
    { x: 0, y: 0, width, height },
  );

  const tiles = layout.map((item) => {
    const sign = item.changePct >= 0 ? "+" : "";
    return `<div class="heatmap-tile ${changeColor(item.changePct)}"
      style="left:${item.x}px;top:${item.y}px;width:${item.w}px;height:${item.h}px"
      role="img" aria-label="${escapeAttr(item.ticker)} ${sign}${item.changePct.toFixed(1)}%"
      data-sector="${escapeAttr(item.ticker)}">
      <span class="heatmap-label">${escapeHtml(item.ticker)}</span>
      <span class="heatmap-pct">${sign}${item.changePct.toFixed(1)}%</span>
    </div>`;
  });

  patchDOM(
    container,
    `
        <div class="heatmap-grid" role="img" aria-label="Sector Heatmap"
          style="position:relative;width:${width}px;height:${height}px;overflow:hidden">
      ${tiles.join("")}
    </div>
    <p class="text-secondary">${sectors.length} sectors</p>
  `,
  );
}

/** Render a TradingView-style global asset-class heatmap overview. */
export function renderGlobalHeatmap(
  container: HTMLElement,
  assetClass: HeatmapAssetClass,
  items: readonly GlobalHeatmapItem[],
  options?: HeatmapOptions,
): void {
  if (items.length === 0) {
    patchDOM(container, `<p class="empty-state">No ${assetClass} data available.</p>`);
    return;
  }

  const width = options?.width ?? 760;
  const height = options?.height ?? 420;
  const layout = computeHeatmap(
    items.map((item) => ({
      ticker: item.symbol,
      weight: item.weight,
      changePct: item.changePercent,
    })),
    { x: 0, y: 0, width, height },
  );
  const itemBySymbol = new Map(items.map((item) => [item.symbol, item]));
  const groups = [...new Set(items.map((item) => item.group))];
  const tiles = layout
    .map((item) => {
      const data = itemBySymbol.get(item.ticker);
      if (!data) return "";
      const sign = data.changePercent >= 0 ? "+" : "";
      return `<button class="heatmap-tile ${changeColor(data.changePercent)}"
        style="left:${item.x}px;top:${item.y}px;width:${item.w}px;height:${item.h}px"
        data-action="heatmap-tile" data-symbol="${escapeAttr(data.symbol)}"
        aria-label="${escapeAttr(`${data.name}, ${sign}${data.changePercent.toFixed(2)} percent, ${data.group}`)}">
        <span class="heatmap-label">${escapeHtml(data.symbol)}</span>
        <span class="heatmap-name">${escapeHtml(data.name)}</span>
        <span class="heatmap-pct">${sign}${data.changePercent.toFixed(2)}%</span>
      </button>`;
    })
    .join("");

  const labels: Record<HeatmapAssetClass, string> = {
    stocks: "Global stocks",
    fx: "Foreign exchange",
    futures: "Futures",
    crypto: "Crypto",
  };

  patchDOM(
    container,
    `<div class="heatmap-overview">
      <nav class="heatmap-class-tabs" aria-label="Asset class">
        ${Object.entries({ stocks: "Stocks", fx: "FX", futures: "Futures", crypto: "Crypto" })
          .map(
            ([key, label]) =>
              `<button class="btn-sort${key === assetClass ? " sort-active" : ""}"
                data-action="heatmap-class" data-heatmap-class="${key}">${label}</button>`,
          )
          .join("")}
      </nav>
      <div class="heatmap-overview-head">
        <div>
          <p class="eyebrow">Market map</p>
          <h2>${labels[assetClass]}</h2>
          <p class="text-secondary">Area represents relative size · color shows daily change</p>
        </div>
        <span class="heatmap-snapshot">Delayed snapshot · ${items.length} instruments</span>
      </div>
      <div class="heatmap-grid heatmap-global-grid" role="group" aria-label="${labels[assetClass]} heatmap"
        style="position:relative;width:${width}px;height:${height}px;overflow:hidden">${tiles}</div>
      <div class="heatmap-footer">
        <span class="text-secondary">Groups: ${groups.map(escapeHtml).join(" · ")}</span>
        <span class="heatmap-legend" aria-label="Daily change legend">
          <span class="heatmap-legend-swatch heatmap-strong-down"></span><span>-3%</span>
          <span class="heatmap-legend-swatch heatmap-flat"></span><span>0%</span>
          <span class="heatmap-legend-swatch heatmap-strong-up"></span><span>+3%</span>
        </span>
      </div>
    </div>`,
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
