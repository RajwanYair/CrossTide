/**
 * Seasonality card — shows monthly and day-of-week historical return patterns.
 *
 * Renders bar charts (CSS-based) for average return per month and per weekday,
 * plus win-rate indicators, using the existing seasonality domain module.
 */
import type { DailyCandle } from "../types/domain";
import type { SeasonalityBucket, DailyReturn } from "../domain/seasonality";
import { seasonalityByMonth, seasonalityByDayOfWeek } from "../domain/seasonality";
import { fetchTickerData } from "../core/data-service";
import { getNavigationSignal } from "../ui/router";
import { patchDOM } from "../core/patch-dom";
import type { CardModule, CardContext } from "./registry";

/** Convert candles to daily returns for the seasonality engine. */
function candlesToReturns(candles: readonly DailyCandle[]): DailyReturn[] {
  const returns: DailyReturn[] = [];
  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1]!;
    const curr = candles[i]!;
    if (prev.close === 0) continue;
    returns.push({
      time: new Date(curr.date).getTime(),
      returnFraction: (curr.close - prev.close) / prev.close,
    });
  }
  return returns;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Render a single bar in the seasonality bar chart. */
function renderBar(bucket: SeasonalityBucket, maxAbsReturn: number): string {
  const pct = maxAbsReturn > 0 ? (bucket.meanReturn / maxAbsReturn) * 100 : 0;
  const cls = bucket.meanReturn >= 0 ? "seasonal-bar-positive" : "seasonal-bar-negative";
  const widthPct = Math.min(Math.abs(pct), 100);
  const winPct = (bucket.winRate * 100).toFixed(0);
  const returnPct = (bucket.meanReturn * 100).toFixed(2);

  return `<div class="seasonal-row">
    <span class="seasonal-label">${escapeHtml(bucket.label)}</span>
    <div class="seasonal-bar-track">
      <div class="seasonal-bar ${cls}" style="width:${widthPct}%" aria-label="${returnPct}% avg return"></div>
    </div>
    <span class="seasonal-return">${returnPct}%</span>
    <span class="seasonal-winrate" title="Win rate">${winPct}%W</span>
  </div>`;
}

/** Render a section (monthly or day-of-week). */
function renderSection(title: string, buckets: SeasonalityBucket[]): string {
  if (buckets.length === 0) return "";

  const maxAbs = Math.max(...buckets.map((b) => Math.abs(b.meanReturn)), 0.001);
  const bars = buckets.map((b) => renderBar(b, maxAbs)).join("");

  return `<div class="seasonal-section">
    <h3 class="seasonal-section-title">${escapeHtml(title)}</h3>
    <div class="seasonal-chart">${bars}</div>
  </div>`;
}

function renderSeasonality(
  container: HTMLElement,
  ticker: string,
  candles: readonly DailyCandle[],
): void {
  if (!ticker) {
    patchDOM(container, `<p class="empty-state">Select a ticker to view seasonality patterns.</p>`);
    return;
  }

  if (candles.length < 30) {
    patchDOM(
      container,
      `<p class="empty-state">Insufficient data for ${escapeHtml(ticker)} seasonality (need 30+ candles).</p>`,
    );
    return;
  }

  const returns = candlesToReturns(candles);
  const monthly = seasonalityByMonth(returns);
  const weekly = seasonalityByDayOfWeek(returns);

  const html = `
    <div class="seasonal-header">
      <h2>Seasonality — ${escapeHtml(ticker)}</h2>
      <span class="seasonal-period">${candles.length} trading days</span>
    </div>
    ${renderSection("Monthly Average Returns", monthly)}
    ${renderSection("Day-of-Week Average Returns", weekly)}
  `;

  patchDOM(container, html);
}

const seasonalityCard: CardModule = {
  mount(container, ctx) {
    const ticker = ctx.params["symbol"] ?? "";
    renderSeasonality(container, ticker, []);

    if (ticker) {
      void fetchTickerData(ticker, getNavigationSignal()).then((data) => {
        renderSeasonality(container, ticker, data.candles);
      });
    }

    return {
      update(newCtx: CardContext): void {
        const t = newCtx.params["symbol"] ?? "";
        renderSeasonality(container, t, []);
        if (t) {
          void fetchTickerData(t, getNavigationSignal()).then((data) => {
            renderSeasonality(container, t, data.candles);
          });
        }
      },
    };
  },
};

export default seasonalityCard;
