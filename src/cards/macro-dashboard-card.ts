/**
 * Macro Dashboard card (H19).
 *
 * Displays VIX, 10Y yield, DXY, Gold, and WTI with value/change/sparkline
 * and a simple risk regime badge derived from VIX + DXY direction.
 */
import { fetchAllTickers, type TickerData } from "../core/data-service";
import { getNavigationSignal } from "../ui/router";
import type { CardModule } from "./registry";

interface MacroMetric {
  key: string;
  label: string;
  ticker: string;
  suffix?: string;
}

const METRICS: readonly MacroMetric[] = [
  { key: "vix", label: "VIX", ticker: "^VIX" },
  { key: "us10y", label: "US 10Y", ticker: "^TNX", suffix: "%" },
  { key: "dxy", label: "DXY", ticker: "DX-Y.NYB" },
  { key: "gold", label: "Gold", ticker: "GC=F" },
  { key: "wti", label: "WTI", ticker: "CL=F" },
];

export type RiskRegime = "risk-on" | "risk-off" | "neutral";

export function deriveRiskRegime(vix: number, dxyChangePct: number): RiskRegime {
  if (vix >= 22 || dxyChangePct > 0.35) return "risk-off";
  if (vix <= 16 && dxyChangePct <= 0) return "risk-on";
  return "neutral";
}

function sparklinePath(values: readonly number[], w = 90, h = 26): string {
  if (values.length < 2) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function renderMetricCard(metric: MacroMetric, data: TickerData | undefined): string {
  const value = data?.price ?? 0;
  const cp = data?.changePercent ?? 0;
  const trendClass = cp >= 0 ? "up" : "dn";
  const spark = sparklinePath(data?.closes30d ?? []);
  return `<div class="macro-metric-card">
    <div class="macro-metric-head">
      <span class="macro-label">${metric.label}</span>
      <span class="font-mono ${trendClass}">${cp >= 0 ? "+" : ""}${cp.toFixed(2)}%</span>
    </div>
    <div class="macro-value font-mono">${value.toFixed(2)}${metric.suffix ?? ""}</div>
    <svg class="macro-spark" viewBox="0 0 90 26" preserveAspectRatio="none" aria-hidden="true">
      <path d="${spark}" fill="none" stroke="currentColor" stroke-width="1.5" />
    </svg>
  </div>`;
}

export function renderMacroDashboard(
  container: HTMLElement,
  rows: ReadonlyMap<string, TickerData>,
): void {
  const cards = METRICS.map((m) => renderMetricCard(m, rows.get(m.ticker))).join("");
  const vix = rows.get("^VIX")?.price ?? 0;
  const dxyChange = rows.get("DX-Y.NYB")?.changePercent ?? 0;
  const regime = deriveRiskRegime(vix, dxyChange);

  container.innerHTML = `<div class="card macro-card">
    <div class="card-header">
      <h2>Macro Dashboard</h2>
      <span class="badge badge-${regime}">${regime}</span>
    </div>
    <div class="macro-grid">${cards}</div>
  </div>`;
}

const macroDashboardCard: CardModule = {
  mount(container) {
    let disposed = false;

    async function load(): Promise<void> {
      const tickers = METRICS.map((m) => m.ticker);
      const rows = await fetchAllTickers(tickers, undefined, getNavigationSignal());
      if (disposed) return;
      renderMacroDashboard(container, rows);
    }

    container.innerHTML = `<div class="card"><div class="card-body"><p class="empty-state">Loading macro context…</p></div></div>`;
    void load();

    return {
      dispose(): void {
        disposed = true;
      },
    };
  },
};

export default macroDashboardCard;
