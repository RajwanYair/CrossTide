/**
 * Risk metrics card — displays Sortino ratio, max drawdown, CAGR,
 * and Calmar ratio using demo equity curve data.
 *
 * In production the equity curve would come from the backtest engine
 * wired to the user's watchlist + holdings. For now demo data is used
 * to make the card immediately visible and testable.
 */
import { sortinoRatio, maxDrawdown, cagr, calmarRatio } from "../domain/risk-ratios";
import type { CardModule } from "./registry";

// ── Demo equity curve: 5-year daily data (simulated) ─────────────────────────
function generateEquityCurve(seed = 42): number[] {
  // Deterministic pseudo-random walk seeded for reproducibility
  let state = seed;
  function rng(): number {
    state = (state * 1664525 + 1013904223) & 0xffffffff;
    return ((state >>> 0) / 0x100000000 - 0.5) * 2;
  }
  const curve: number[] = [10000];
  for (let i = 0; i < 1259; i++) {
    // ~252 trading days × 5 years; gentle upward drift
    const prev = curve[curve.length - 1]!;
    const r = 0.0003 + rng() * 0.012; // ~7.5 % annualized drift, ±1.2 % daily sigma
    curve.push(prev * (1 + r));
  }
  return curve;
}

const EQUITY = generateEquityCurve();
const YEARS = EQUITY.length / 252;

// Daily returns from the equity curve
const RETURNS = EQUITY.slice(1).map((v, i) => v / EQUITY[i]! - 1);

function fmt2(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(n: number, decimals = 1): string {
  return (n * 100).toFixed(decimals) + "%";
}

function gaugeBar(value: number, min: number, max: number, colorClass: string): string {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  return `<div class="risk-gauge-wrap">
    <div class="risk-gauge-fill ${colorClass}" style="width:${pct}%"></div>
  </div>`;
}

function renderRiskCard(container: HTMLElement): void {
  const sortino = sortinoRatio(RETURNS);
  const dd = maxDrawdown(EQUITY);
  const annualizedReturn = cagr(EQUITY, YEARS);
  const calmar = calmarRatio(EQUITY, YEARS);

  // Equity curve mini-chart (SVG sparkline of normalized curve)
  const normalized = EQUITY.map((v) => v / EQUITY[0]!);
  const w = 320;
  const h = 80;
  const xScale = (i: number): number => (i / (normalized.length - 1)) * w;
  const yMin = Math.min(...normalized);
  const yMax = Math.max(...normalized);
  const yRange = yMax - yMin || 1;
  const yScale = (v: number): number => h - ((v - yMin) / yRange) * (h - 4) - 2;

  const points = normalized.map((v, i) => `${xScale(i).toFixed(1)},${yScale(v).toFixed(1)}`).join(" ");
  const polyline = `<polyline fill="none" stroke="var(--color-accent, #58a6ff)" stroke-width="1.5" points="${points}" />`;
  const equitySVG = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true">${polyline}</svg>`;

  // Color coding
  const sortinoClass = sortino >= 1.5 ? "text-positive" : sortino >= 0.5 ? "" : "text-negative";
  const ddClass = dd <= 0.1 ? "text-positive" : dd <= 0.25 ? "" : "text-negative";
  const cagrClass = annualizedReturn >= 0.1 ? "text-positive" : annualizedReturn >= 0 ? "" : "text-negative";
  const calmarClass = calmar >= 1 ? "text-positive" : calmar >= 0.5 ? "" : "text-negative";

  container.innerHTML = `
    <div class="risk-layout">

      <!-- Equity curve sparkline -->
      <div class="risk-equity-chart">
        <div class="risk-equity-header">
          <span class="stat-label">Equity Curve (5 yr, demo)</span>
          <span class="stat-value ${cagrClass}">${fmtPct(annualizedReturn)} CAGR</span>
        </div>
        ${equitySVG}
      </div>

      <!-- Metric grid -->
      <div class="risk-metric-grid">

        <div class="risk-metric-card">
          <span class="stat-label">Sortino Ratio</span>
          <span class="stat-value ${sortinoClass}">${fmt2(sortino)}</span>
          ${gaugeBar(sortino, 0, 3, sortinoClass)}
          <span class="risk-hint">≥ 1.5 excellent · ≥ 0.5 acceptable</span>
        </div>

        <div class="risk-metric-card">
          <span class="stat-label">Max Drawdown</span>
          <span class="stat-value ${ddClass}">−${fmtPct(dd)}</span>
          ${gaugeBar(dd, 0, 0.6, ddClass)}
          <span class="risk-hint">lower is better · &lt; 10% excellent</span>
        </div>

        <div class="risk-metric-card">
          <span class="stat-label">CAGR (annualized)</span>
          <span class="stat-value ${cagrClass}">${fmtPct(annualizedReturn)}</span>
          ${gaugeBar(annualizedReturn, -0.1, 0.4, cagrClass)}
          <span class="risk-hint">compound annual growth rate</span>
        </div>

        <div class="risk-metric-card">
          <span class="stat-label">Calmar Ratio</span>
          <span class="stat-value ${calmarClass}">${calmar === Infinity ? "∞" : fmt2(calmar)}</span>
          ${gaugeBar(Math.min(calmar, 3), 0, 3, calmarClass)}
          <span class="risk-hint">CAGR ÷ max drawdown · ≥ 1 good</span>
        </div>

      </div>

      <p class="empty-state portfolio-demo-note">
        Demo equity curve — wire to backtest engine output in Sprint B4.
      </p>

    </div>
  `;
}

const riskCard: CardModule = {
  mount(container, _ctx) {
    renderRiskCard(container);
    return {};
  },
};

export default riskCard;
