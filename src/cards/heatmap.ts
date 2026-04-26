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
    container.innerHTML = `<p class="empty-state">No sector data available.</p>`;
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

  container.innerHTML = `
    <div class="heatmap-grid" role="img" aria-label="Sector Heatmap"
         style="display:flex;width:${width}px;height:${height}px;overflow:hidden">
      ${tiles.join("")}
    </div>
    <p class="text-secondary">${sectors.length} sectors</p>
  `;
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
