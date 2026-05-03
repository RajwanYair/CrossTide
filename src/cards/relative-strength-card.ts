/**
 * Relative Strength Comparison card (H21).
 */
import { loadConfig } from "../core/config";
import { fetchAllTickers } from "../core/data-service";
import { getNavigationSignal } from "../ui/router";
import type { CardModule } from "./registry";
import { patchDOM } from "../core/patch-dom";
import { createDelegate } from "../ui/delegate";

type WindowKey = "1m" | "3m" | "6m" | "1y" | "ytd";

const WINDOWS: Record<WindowKey, number> = {
  "1m": 21,
  "3m": 63,
  "6m": 126,
  "1y": 252,
  ytd: 252,
};

const COLORS = ["#16a34a", "#0284c7", "#d97706", "#dc2626", "#7c3aed", "#0f766e"];

export function normalizeReturns(closes: readonly number[]): number[] {
  if (closes.length === 0) return [];
  const base = closes[0]!;
  if (!Number.isFinite(base) || base === 0) return closes.map(() => 0);
  return closes.map((c) => ((c - base) / base) * 100);
}

function linePath(
  values: readonly number[],
  w: number,
  h: number,
  min: number,
  max: number,
): string {
  if (values.length < 2) return "";
  const range = max - min || 1;
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

interface SeriesData {
  ticker: string;
  values: number[];
}

export function renderRelativeStrength(
  container: HTMLElement,
  series: readonly SeriesData[],
  benchmark: string,
): void {
  const all = series.flatMap((s) => s.values);
  const min = all.length > 0 ? Math.min(...all) : -1;
  const max = all.length > 0 ? Math.max(...all) : 1;
  const w = 760;
  const h = 300;

  const lines = series
    .map((s, idx) => {
      const isBenchmark = s.ticker === benchmark;
      const path = linePath(s.values, w, h, min, max);
      const stroke = isBenchmark ? "#94a3b8" : COLORS[idx % COLORS.length];
      const dash = isBenchmark ? ' stroke-dasharray="4 4"' : "";
      return `<path d="${path}" fill="none" stroke="${stroke}" stroke-width="2"${dash} />`;
    })
    .join("");

  const legend = series
    .map((s, idx) => {
      const color = s.ticker === benchmark ? "#94a3b8" : COLORS[idx % COLORS.length];
      const last = s.values[s.values.length - 1] ?? 0;
      return `<span class="rs-legend-item"><span class="rs-dot" style="background:${color}"></span>${s.ticker} ${last >= 0 ? "+" : ""}${last.toFixed(2)}%</span>`;
    })
    .join("");

  patchDOM(
    container,
    `<div class="card">
    <div class="card-header"><h2>Relative Strength</h2></div>
    <div class="card-body">
      <svg class="rs-chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${lines}</svg>
      <div class="rs-legend">${legend}</div>
    </div>
  </div>`,
  );
}

const relativeStrengthCard: CardModule = {
  mount(container) {
    let disposed = false;
    let windowKey: WindowKey = "3m";
    let benchmark = "SPY";

    async function loadAndRender(): Promise<void> {
      const cfg = loadConfig();
      const watch = cfg.watchlist.map((w) => w.ticker).slice(0, 6);
      const tickers = Array.from(new Set([...watch, benchmark]));
      if (tickers.length === 0) {
        patchDOM(
          container,
          `<div class="card"><div class="card-body"><p class="empty-state">No watchlist tickers for comparison.</p></div></div>`,
        );
        return;
      }
      const rows = await fetchAllTickers(tickers, undefined, getNavigationSignal());
      if (disposed) return;

      const series: SeriesData[] = [];
      const days = WINDOWS[windowKey];
      for (const ticker of tickers) {
        const closes = rows.get(ticker)?.candles.map((c) => c.close) ?? [];
        const clipped = closes.slice(-days);
        series.push({ ticker, values: normalizeReturns(clipped) });
      }

      patchDOM(
        container,
        `<div class="rs-controls">
          <label>Window
            <select id="rs-window">
              <option value="1m"${windowKey === "1m" ? " selected" : ""}>1M</option>
              <option value="3m"${windowKey === "3m" ? " selected" : ""}>3M</option>
              <option value="6m"${windowKey === "6m" ? " selected" : ""}>6M</option>
              <option value="1y"${windowKey === "1y" ? " selected" : ""}>1Y</option>
              <option value="ytd"${windowKey === "ytd" ? " selected" : ""}>YTD</option>
            </select>
          </label>
          <label>Benchmark
            <input id="rs-benchmark" value="${benchmark}" />
          </label>
          <button id="rs-apply" type="button" data-action="apply-rs">Apply</button>
        </div>
        <div id="rs-body"></div>`,
      );

      const body = container.querySelector<HTMLElement>("#rs-body");
      if (body) renderRelativeStrength(body, series, benchmark);
    }

    patchDOM(
      container,
      `<div class="card"><div class="card-body"><p class="empty-state">Loading relative strength…</p></div></div>`,
    );

    const delegate = createDelegate(container, {
      "apply-rs": () => {
        const nextW = container.querySelector<HTMLSelectElement>("#rs-window")?.value as WindowKey;
        const nextB = container
          .querySelector<HTMLInputElement>("#rs-benchmark")
          ?.value.trim()
          .toUpperCase();
        if (nextW) windowKey = nextW;
        if (nextB) benchmark = nextB;
        void loadAndRender();
      },
    });

    void loadAndRender();

    return {
      dispose(): void {
        disposed = true;
        delegate.dispose();
      },
    };
  },
};

export default relativeStrengthCard;
