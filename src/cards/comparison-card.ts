/**
 * Chart comparison card — overlay multiple tickers normalized to % change.
 *
 * The user enters comma-separated tickers; the card fetches data for each,
 * normalizes to % change from the first common date, and renders an SVG
 * line chart with color-coded series + a summary stats table.
 */
import { normalizeForComparison, computeComparisonStats } from "../domain/chart-comparison";
import { fetchTickerData } from "../core/data-service";
import { getNavigationSignal } from "../ui/router";
import { showToast } from "../ui/toast";
import type { DailyCandle } from "../types/domain";
import type { CardModule, CardHandle, CardContext } from "./registry";

const COLORS = ["#2962ff", "#e91e63", "#00bfa5", "#ff6d00", "#7c4dff", "#64dd17"];

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderSvgChart(
  series: readonly { ticker: string; points: readonly { date: string; pctChange: number }[] }[],
): string {
  if (series.length === 0 || series[0]!.points.length === 0) {
    return `<p class="muted">No overlapping data to display.</p>`;
  }

  const W = 720;
  const H = 320;
  const PAD = 40;

  // Compute Y bounds across all series
  let yMin = Infinity;
  let yMax = -Infinity;
  for (const s of series) {
    for (const p of s.points) {
      if (p.pctChange < yMin) yMin = p.pctChange;
      if (p.pctChange > yMax) yMax = p.pctChange;
    }
  }
  // Add 5% padding
  const yRange = yMax - yMin || 0.01;
  yMin -= yRange * 0.05;
  yMax += yRange * 0.05;

  const numPoints = series[0]!.points.length;
  const xScale = (W - PAD * 2) / Math.max(numPoints - 1, 1);
  const yScale = (H - PAD * 2) / (yMax - yMin);

  const toX = (i: number): number => PAD + i * xScale;
  const toY = (v: number): number => H - PAD - (v - yMin) * yScale;

  // Zero line
  const zeroY = toY(0);

  let paths = "";
  const legend: string[] = [];

  for (let si = 0; si < series.length; si++) {
    const s = series[si]!;
    const color = COLORS[si % COLORS.length]!;
    const d = s.points
      .map((p, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(p.pctChange).toFixed(1)}`)
      .join(" ");
    paths += `<path d="${d}" fill="none" stroke="${color}" stroke-width="2" />`;
    legend.push(`<span style="color:${color}">■</span> ${escapeHtml(s.ticker)}`);
  }

  return `<div class="comparison-chart-wrapper">
    <svg viewBox="0 0 ${W} ${H}" class="comparison-svg" aria-label="Comparison chart">
      <line x1="${PAD}" y1="${zeroY.toFixed(1)}" x2="${W - PAD}" y2="${zeroY.toFixed(1)}" stroke="#888" stroke-dasharray="4" />
      ${paths}
    </svg>
    <div class="comparison-legend">${legend.join(" &nbsp; ")}</div>
  </div>`;
}

function renderStatsTable(
  series: readonly { ticker: string; points: readonly { date: string; pctChange: number }[] }[],
): string {
  if (series.length === 0) return "";
  const stats = series.map((s) => computeComparisonStats(s));
  const rows = stats
    .map((st) => {
      const color = st.totalReturn >= 0 ? "var(--clr-buy)" : "var(--clr-sell)";
      return `<tr>
      <td>${escapeHtml(st.ticker)}</td>
      <td style="color:${color}">${(st.totalReturn * 100).toFixed(2)}%</td>
      <td>${(st.maxDrawdown * 100).toFixed(2)}%</td>
      <td>${(st.bestDay * 100).toFixed(2)}%</td>
      <td>${(st.worstDay * 100).toFixed(2)}%</td>
    </tr>`;
    })
    .join("");

  return `<table class="mini-table comparison-stats-table">
    <thead><tr><th>Ticker</th><th>Total Return</th><th>Max DD</th><th>Best Day</th><th>Worst Day</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function mount(container: HTMLElement, ctx: CardContext): CardHandle {
  const initialSymbol = ctx.params["symbol"] ?? "";
  container.innerHTML = `
    <h2>Chart Comparison</h2>
    <div class="comparison-input-row">
      <label for="comparison-tickers">Tickers (comma-separated):</label>
      <input id="comparison-tickers" type="text" placeholder="AAPL, MSFT, GOOGL" class="input" value="${initialSymbol ? initialSymbol + ", SPY" : ""}" />
      <button id="btn-compare" class="btn btn-sm">Compare</button>
    </div>
    <div id="comparison-output" class="comparison-output"></div>
  `;

  const input = container.querySelector<HTMLInputElement>("#comparison-tickers")!;
  const btn = container.querySelector<HTMLButtonElement>("#btn-compare")!;
  const output = container.querySelector<HTMLElement>("#comparison-output")!;

  async function runComparison(): Promise<void> {
    const raw = input.value.trim();
    if (!raw) return;

    const tickers = raw
      .split(",")
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean)
      .slice(0, 6); // max 6 tickers

    if (tickers.length < 2) {
      showToast({ message: "Enter at least 2 tickers to compare", type: "warning" });
      return;
    }

    btn.disabled = true;
    btn.textContent = "Loading…";
    output.innerHTML = `<p class="muted">Fetching data for ${tickers.join(", ")}…</p>`;

    try {
      const signal = getNavigationSignal();
      const results = await Promise.all(
        tickers.map(async (ticker) => {
          const data = await fetchTickerData(ticker, signal);
          return { ticker, candles: data.candles ?? [] } as {
            ticker: string;
            candles: DailyCandle[];
          };
        }),
      );

      const tickerCandles = new Map<string, readonly DailyCandle[]>();
      for (const r of results) {
        if (r.candles.length > 0) {
          tickerCandles.set(r.ticker, r.candles);
        }
      }

      if (tickerCandles.size < 2) {
        output.innerHTML = `<p class="muted">Not enough data found — need at least 2 tickers with candle data.</p>`;
        return;
      }

      const series = normalizeForComparison(tickerCandles);
      output.innerHTML = renderSvgChart(series) + renderStatsTable(series);
    } catch (err) {
      output.innerHTML = `<p class="error">Error: ${escapeHtml((err as Error).message)}</p>`;
      showToast({ message: "Comparison failed", type: "error" });
    } finally {
      btn.disabled = false;
      btn.textContent = "Compare";
    }
  }

  btn.addEventListener("click", () => void runComparison());
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") void runComparison();
  });

  // Auto-run if symbol was provided
  if (initialSymbol) void runComparison();

  return {
    update(newCtx: CardContext): void {
      const t = newCtx.params["symbol"] ?? "";
      if (t) {
        input.value = `${t}, SPY`;
        void runComparison();
      }
    },
  };
}

const card: CardModule = { mount };
export default card;
