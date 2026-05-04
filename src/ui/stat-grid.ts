/**
 * `<ct-stat-grid>` — Responsive grid of metric stat cards.
 *
 * Renders a CSS grid of key-value stat items with optional
 * trend indicators (up/down/neutral) and formatting.
 *
 * Usage:
 *   const grid = document.createElement("ct-stat-grid");
 *   grid.stats = [
 *     { label: "Market Cap", value: "$2.8T", trend: "up" },
 *     { label: "P/E Ratio", value: "28.5" },
 *     { label: "Dividend", value: "0.55%", trend: "down" },
 *   ];
 *   container.appendChild(grid);
 */

export type StatTrend = "up" | "down" | "neutral";

export interface StatItem {
  readonly label: string;
  readonly value: string;
  readonly trend?: StatTrend;
  /** Secondary helper text (e.g. percent change). */
  readonly subtext?: string;
  /** Optional CSS class for custom styling. */
  readonly className?: string;
}

export interface StatGridOptions {
  /** Minimum column width in the CSS grid. Defaults to "140px". */
  readonly minColumnWidth?: string;
  /** Gap between stat items. Defaults to "var(--space-3, 0.75rem)". */
  readonly gap?: string;
  /** ARIA label for the grid container. */
  readonly ariaLabel?: string;
}

const DEFAULT_MIN_COL = "140px";
const DEFAULT_GAP = "var(--space-3, 0.75rem)";

class CtStatGrid extends HTMLElement {
  private _stats: StatItem[] = [];
  private _options: StatGridOptions = {};
  private _connected = false;

  set stats(items: StatItem[]) {
    this._stats = items;
    if (this._connected) this.render();
  }

  get stats(): StatItem[] {
    return this._stats;
  }

  set options(opts: StatGridOptions) {
    this._options = opts;
    if (this._connected) this.render();
  }

  get options(): StatGridOptions {
    return this._options;
  }

  connectedCallback(): void {
    this._connected = true;
    this.render();
  }

  disconnectedCallback(): void {
    this._connected = false;
  }

  private render(): void {
    const minCol = this._options.minColumnWidth ?? DEFAULT_MIN_COL;
    const gap = this._options.gap ?? DEFAULT_GAP;
    const ariaLabel = this._options.ariaLabel ?? "Statistics";

    const items = this._stats
      .map((stat) => {
        const trendClass = stat.trend ? ` ct-sg-item--${stat.trend}` : "";
        const extraClass = stat.className ? ` ${stat.className}` : "";
        const trendIcon = getTrendIcon(stat.trend);
        const subtext = stat.subtext
          ? `<span class="ct-sg-subtext">${escapeHtml(stat.subtext)}</span>`
          : "";
        return [
          `<div class="ct-sg-item${trendClass}${extraClass}">`,
          `  <span class="ct-sg-label">${escapeHtml(stat.label)}</span>`,
          `  <span class="ct-sg-value">${trendIcon}${escapeHtml(stat.value)}</span>`,
          subtext ? `  ${subtext}` : "",
          `</div>`,
        ]
          .filter(Boolean)
          .join("");
      })
      .join("");

    this.innerHTML = [
      `<div class="ct-sg" role="list" aria-label="${escapeHtml(ariaLabel)}"`,
      ` style="display:grid;grid-template-columns:repeat(auto-fill,minmax(${minCol},1fr));gap:${gap}">`,
      items,
      `</div>`,
    ].join("");
  }
}

function getTrendIcon(trend?: StatTrend): string {
  switch (trend) {
    case "up":
      return `<span class="ct-sg-trend ct-sg-trend--up" aria-label="trending up">▲ </span>`;
    case "down":
      return `<span class="ct-sg-trend ct-sg-trend--down" aria-label="trending down">▼ </span>`;
    default:
      return "";
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

customElements.define("ct-stat-grid", CtStatGrid);

export { CtStatGrid };
