/**
 * Chart card — scaffold for candlestick chart rendering.
 *
 * This module provides the chart container setup and data formatting.
 * Actual chart rendering uses Lightweight Charts (dynamic import, Phase 2).
 * For now, renders a summary table of recent OHLCV data.
 */
import type { DailyCandle } from "../types/domain";

export interface ChartOptions {
  ticker: string;
  candles: readonly DailyCandle[];
  width?: number;
  height?: number;
}

export function renderChart(container: HTMLElement, options: ChartOptions): void {
  const { ticker, candles, width = 800, height = 400 } = options;

  if (candles.length === 0) {
    container.innerHTML = `<p class="empty-state">No chart data for ${escapeHtml(ticker)}.</p>`;
    return;
  }

  const latest = candles[candles.length - 1]!;
  const first = candles[0]!;
  const changePct = ((latest.close - first.close) / first.close) * 100;
  const changeClass = changePct >= 0 ? "signal-buy" : "signal-sell";
  const sign = changePct >= 0 ? "+" : "";

  container.innerHTML = `
    <div class="chart-header">
      <h3>${escapeHtml(ticker)}</h3>
      <span class="chart-price font-mono">${latest.close.toFixed(2)}</span>
      <span class="chart-change ${changeClass} font-mono">${sign}${changePct.toFixed(2)}%</span>
      <span class="text-secondary">${candles.length} candles</span>
    </div>
    <div class="chart-canvas" data-ticker="${escapeHtml(ticker)}" style="width:${width}px;height:${height}px;">
      ${renderOhlcTable(candles.slice(-10))}
    </div>
  `;
}

function renderOhlcTable(candles: readonly DailyCandle[]): string {
  const rows = candles
    .map(
      (c) =>
        `<tr>
      <td>${c.date}</td>
      <td class="font-mono">${c.open.toFixed(2)}</td>
      <td class="font-mono">${c.high.toFixed(2)}</td>
      <td class="font-mono">${c.low.toFixed(2)}</td>
      <td class="font-mono">${c.close.toFixed(2)}</td>
      <td class="font-mono">${formatVolume(c.volume)}</td>
    </tr>`,
    )
    .join("");

  return `<table class="ohlc-table">
    <thead><tr><th>Date</th><th>O</th><th>H</th><th>L</th><th>C</th><th>Vol</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
