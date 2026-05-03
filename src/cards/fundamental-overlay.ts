/**
 * Fundamental data overlay — renders a compact metric grid below the chart header.
 */
import type { FundamentalData } from "../types/domain";

/** Format large numbers (revenue, market cap) into human-readable abbreviations. */
function formatLargeNumber(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(2);
}

/** Format a ratio/percentage value, returning '—' for undefined. */
function fmt(val: number | undefined, suffix = ""): string {
  if (val == null) return "—";
  return `${val.toFixed(2)}${suffix}`;
}

/**
 * Render fundamental data overlay HTML.
 * Returns empty string if data is null (graceful degradation).
 */
export function renderFundamentalsOverlay(data: FundamentalData | null): string {
  if (!data) return "";

  const metrics: Array<{ label: string; value: string }> = [];

  if (data.peRatio != null) metrics.push({ label: "P/E", value: fmt(data.peRatio) });
  if (data.forwardPe != null) metrics.push({ label: "Fwd P/E", value: fmt(data.forwardPe) });
  if (data.eps != null) metrics.push({ label: "EPS", value: fmt(data.eps) });
  if (data.marketCap != null)
    metrics.push({ label: "Mkt Cap", value: formatLargeNumber(data.marketCap) });
  if (data.revenue != null)
    metrics.push({ label: "Revenue", value: formatLargeNumber(data.revenue) });
  if (data.dividendYield != null)
    metrics.push({ label: "Div Yield", value: fmt(data.dividendYield * 100, "%") });
  if (data.priceToBook != null) metrics.push({ label: "P/B", value: fmt(data.priceToBook) });
  if (data.debtToEquity != null) metrics.push({ label: "D/E", value: fmt(data.debtToEquity) });
  if (data.returnOnEquity != null)
    metrics.push({ label: "ROE", value: fmt(data.returnOnEquity * 100, "%") });
  if (data.profitMargin != null)
    metrics.push({ label: "Margin", value: fmt(data.profitMargin * 100, "%") });

  if (metrics.length === 0) return "";

  const items = metrics
    .map(
      (m) =>
        `<div class="fundamental-metric"><span class="fundamental-label">${m.label}</span><span class="fundamental-value">${m.value}</span></div>`,
    )
    .join("");

  return `<section class="fundamental-overlay" aria-label="Fundamental data">${items}</section>`;
}
