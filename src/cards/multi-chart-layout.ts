/**
 * Multi-chart Layout Card — D2
 *
 * Displays up to four synchronized chart panels in a 2×2 or 1+3 layout.
 * Each panel shows a 30-day closing-price SVG sparkline for a user-selected
 * ticker. The crosshair (hover line) is synchronised across all panels via
 * `getGlobalChartSyncBus()`.
 *
 * State (selected tickers + layout) is persisted in localStorage.
 */
import type { CardModule, CardHandle } from "./registry";
import { getGlobalChartSyncBus } from "../ui/chart-sync";
import { loadConfig } from "../core/config";
import { patchDOM } from "../core/patch-dom";
import { createDelegate, type DelegateHandle } from "../ui/delegate";

const STORAGE_KEY = "crosstide-multi-chart";
const PANEL_COUNT = 4;
const CANDLE_STORAGE_PREFIX = "crosstide-cache-";

// ── Types ──────────────────────────────────────────────────────────────────

type LayoutMode = "2x2" | "1+3";

interface MultiChartState {
  layout: LayoutMode;
  tickers: string[]; // length = PANEL_COUNT; empty string = empty panel
}

interface PanelDataPoint {
  date: string;
  close: number;
}

// ── Storage helpers ────────────────────────────────────────────────────────

function loadState(): MultiChartState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed: unknown = JSON.parse(raw);
    if (!isValidState(parsed)) return defaultState();
    return parsed;
  } catch {
    return defaultState();
  }
}

function saveState(s: MultiChartState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function defaultState(): MultiChartState {
  return { layout: "2x2", tickers: ["", "", "", ""] };
}

function isValidState(v: unknown): v is MultiChartState {
  return (
    typeof v === "object" &&
    v !== null &&
    "layout" in v &&
    "tickers" in v &&
    Array.isArray((v as Record<string, unknown>)["tickers"])
  );
}

// ── Data helpers ───────────────────────────────────────────────────────────

/**
 * Loads closing-price history for a ticker from the local tiered cache.
 * Falls back to an empty array if nothing is cached.
 */
function loadCachedPrices(ticker: string): PanelDataPoint[] {
  try {
    const raw = localStorage.getItem(CANDLE_STORAGE_PREFIX + ticker);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as Array<unknown>)
      .filter(
        (p): p is PanelDataPoint =>
          typeof p === "object" &&
          p !== null &&
          "date" in p &&
          "close" in p &&
          typeof (p as Record<string, unknown>)["close"] === "number",
      )
      .slice(-30);
  } catch {
    return [];
  }
}

// ── SVG sparkline renderer ──────────────────────────────────────────────────

function renderSparklineSvg(points: PanelDataPoint[], width: number, height: number): string {
  if (points.length < 2) {
    return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <text x="${width / 2}" y="${height / 2}" text-anchor="middle" fill="var(--color-text-muted)" font-size="12">No data</text>
    </svg>`;
  }

  const closes = points.map((p) => p.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;
  const pad = 6;

  const toX = (i: number): number => pad + (i / (points.length - 1)) * (width - pad * 2);
  const toY = (v: number): number => pad + ((max - v) / range) * (height - pad * 2);

  const pathD = closes
    .map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`)
    .join(" ");

  const last = closes[closes.length - 1] ?? 0;
  const first = closes[0] ?? 0;
  const isUp = last >= first;
  const strokeColor = isUp ? "var(--color-bullish, #22c55e)" : "var(--color-bearish, #ef4444)";

  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" class="multi-chart-svg">
    <path d="${pathD}" stroke="${strokeColor}" stroke-width="1.5" fill="none" vector-effect="non-scaling-stroke"/>
    <line class="mc-crosshair-line" x1="0" y1="0" x2="0" y2="${height}" stroke="var(--color-text-muted)" stroke-width="1" opacity="0" style="pointer-events:none;"/>
  </svg>`;
}

// ── Panel HTML builder ──────────────────────────────────────────────────────

function buildPanelHtml(
  panelIndex: number,
  ticker: string,
  availableTickers: string[],
  layout: LayoutMode,
): string {
  const prices = ticker ? loadCachedPrices(ticker) : [];
  const svgContent = ticker
    ? renderSparklineSvg(prices, 280, 120)
    : `<div class="mc-empty-panel">Select a ticker</div>`;

  const last = prices.length ? prices[prices.length - 1] : null;
  const first = prices.length ? prices[0] : null;
  const priceLabel =
    last && first
      ? `${ticker} — $${last.close.toFixed(2)} (${last.close >= first.close ? "+" : ""}${(((last.close - first.close) / first.close) * 100).toFixed(1)}% 30d)`
      : ticker
        ? `${ticker} — loading…`
        : "";

  const isLarge = layout === "1+3" && panelIndex === 0;
  const options = availableTickers
    .map((t) => `<option value="${t}"${t === ticker ? " selected" : ""}>${t}</option>`)
    .join("");

  return `
    <div class="mc-panel${isLarge ? " mc-panel--large" : ""}" data-panel="${panelIndex}">
      <div class="mc-panel-header">
        <select class="mc-ticker-select" data-panel="${panelIndex}" data-action="mc-ticker-change" aria-label="Chart ${panelIndex + 1} ticker">
          <option value="">— Select ticker —</option>
          ${options}
        </select>
        <span class="mc-price-label">${priceLabel}</span>
      </div>
      <div class="mc-panel-chart">${svgContent}</div>
    </div>`;
}

// ── Layout HTML builder ─────────────────────────────────────────────────────

function buildLayoutHtml(state: MultiChartState, availableTickers: string[]): string {
  const panels = Array.from({ length: PANEL_COUNT }, (_, i) =>
    buildPanelHtml(i, state.tickers[i] ?? "", availableTickers, state.layout),
  ).join("\n");

  return `
    <div class="mc-toolbar">
      <span class="mc-section-title">Multi-chart Layout</span>
      <div class="mc-layout-btns" role="group" aria-label="Layout mode">
        <button class="mc-layout-btn${state.layout === "2x2" ? " mc-layout-btn--active" : ""}"
          data-action="mc-layout" data-layout="2x2" title="2×2 grid">⊞ 2×2</button>
        <button class="mc-layout-btn${state.layout === "1+3" ? " mc-layout-btn--active" : ""}"
          data-action="mc-layout" data-layout="1+3" title="1 large + 3 small">⊡ 1+3</button>
      </div>
    </div>
    <div class="mc-grid mc-grid--${state.layout}">
      ${panels}
    </div>`;
}

// ── Styles ──────────────────────────────────────────────────────────────────

const STYLES = `
<style id="multi-chart-styles">
  .mc-toolbar {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border-bottom: 1px solid var(--color-border);
    flex-wrap: wrap;
  }
  .mc-section-title { font-weight: 600; flex: 1; }
  .mc-layout-btns { display: flex; gap: var(--space-1); }
  .mc-layout-btn {
    padding: var(--space-1) var(--space-2);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--color-text);
    cursor: pointer;
    font-size: 0.8rem;
  }
  .mc-layout-btn--active {
    background: var(--color-primary, #3b82f6);
    color: #fff;
    border-color: var(--color-primary, #3b82f6);
  }
  .mc-grid {
    display: grid;
    gap: var(--space-2);
    padding: var(--space-2);
  }
  .mc-grid--2x2 {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto;
  }
  .mc-grid--1\\+3 {
    grid-template-columns: 2fr 1fr;
    grid-template-rows: auto auto;
  }
  .mc-panel {
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    overflow: hidden;
    background: var(--color-surface);
  }
  .mc-panel--large {
    grid-row: 1 / 3;
  }
  .mc-panel-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-2);
    border-bottom: 1px solid var(--color-border);
    min-height: 2.25rem;
  }
  .mc-ticker-select {
    font-size: 0.8rem;
    padding: 2px 4px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-bg);
    color: var(--color-text);
    max-width: 8rem;
  }
  .mc-price-label {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .mc-panel-chart {
    position: relative;
    padding: var(--space-1);
  }
  .mc-panel-chart svg { width: 100%; height: auto; display: block; }
  .mc-empty-panel {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 120px;
    color: var(--color-text-muted);
    font-size: 0.8rem;
  }
  @media (max-width: 600px) {
    .mc-grid--2x2,
    .mc-grid--1\\+3 { grid-template-columns: 1fr; grid-template-rows: none; }
    .mc-panel--large { grid-row: auto; }
  }
</style>`;

// ── Mount ──────────────────────────────────────────────────────────────────

function mount(container: HTMLElement): CardHandle {
  // Inject styles once
  if (!document.getElementById("multi-chart-styles")) {
    container.insertAdjacentHTML("beforebegin", STYLES);
  }

  let state = loadState();
  const cfg = loadConfig();
  const availableTickers = cfg.watchlist.map((w) => w.ticker);

  // Ensure tickers array has PANEL_COUNT entries
  while (state.tickers.length < PANEL_COUNT) state.tickers.push("");

  const bus = getGlobalChartSyncBus();
  const panelIds: string[] = Array.from(
    { length: PANEL_COUNT },
    (_, i) => `mc-panel-${i}-${Date.now()}`,
  );

  function render(): void {
    // Unsubscribe previous panel registrations before re-render
    panelIds.forEach((id) => bus.unsubscribe(id));
    patchDOM(container, buildLayoutHtml(state, availableTickers));
    wireCrosshairSync();
  }

  // Delegated click + change events
  const delegate: DelegateHandle = createDelegate(
    container,
    {
      "mc-ticker-change": (target) => {
        const sel = target as HTMLSelectElement;
        const idx = Number(sel.dataset["panel"] ?? "0");
        if (!Number.isFinite(idx)) return;
        state = { ...state, tickers: state.tickers.map((t, i) => (i === idx ? sel.value : t)) };
        saveState(state);
        render();
      },
      "mc-layout": (target) => {
        const mode = target.dataset["layout"] as LayoutMode | undefined;
        if (!mode || mode === state.layout) return;
        state = { ...state, layout: mode };
        saveState(state);
        render();
      },
    },
    { eventTypes: ["click", "change"] },
  );

  function wireCrosshairSync(): void {
    // Crosshair sync via mousemove on each SVG (non-delegatable mouse tracking)
    container.querySelectorAll<HTMLDivElement>(".mc-panel-chart").forEach((chartDiv, idx) => {
      const svg = chartDiv.querySelector<SVGElement>("svg.multi-chart-svg");
      if (!svg) return;
      const crosshairLine = svg.querySelector<SVGLineElement>(".mc-crosshair-line");

      svg.addEventListener("mousemove", (e) => {
        const rect = svg.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 280;
        bus.publish(panelIds[idx] ?? "", x.toString());
      });

      svg.addEventListener("mouseleave", () => {
        bus.publish(panelIds[idx] ?? "", null);
      });

      // Subscribe to bus: show crosshair on all panels from any panel
      bus.subscribe(panelIds[idx] ?? "", {
        setCrosshair(time: string | null) {
          if (!crosshairLine) return;
          if (time === null) {
            crosshairLine.setAttribute("opacity", "0");
          } else {
            crosshairLine.setAttribute("x1", time);
            crosshairLine.setAttribute("x2", time);
            crosshairLine.setAttribute("opacity", "0.6");
          }
        },
      });
    });
  }

  render();

  return {
    dispose(): void {
      // Unsubscribe all panels from the bus
      delegate.dispose();
      panelIds.forEach((id) => bus.unsubscribe(id));
      if (document.getElementById("multi-chart-styles")) {
        document.getElementById("multi-chart-styles")?.remove();
      }
    },
  };
}

const multiChartLayoutCard: CardModule = { mount };
export default multiChartLayoutCard;
