/**
 * Strategy Comparison Card (L4) — run two backtest configurations
 * against the same ticker data and compare results side-by-side.
 */
import type { ClosedTrade, EquityPoint } from "../domain/equity-curve";
import { runSmaCrossoverLocal } from "../core/backtest-worker-fallback";
import { fetchTickerData } from "../core/data-service";
import { getNavigationSignal } from "../ui/router";
import { patchDOM } from "../core/patch-dom";
import { createDelegate } from "../ui/delegate";
import type { CardModule, CardContext } from "./registry";

type Candle = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

function syntheticCandles(n: number, seed = 7): Candle[] {
  let state = seed;
  const rng = (): number => {
    state = (state * 1664525 + 1013904223) & 0xffffffff;
    return ((state >>> 0) / 0x100000000 - 0.5) * 2;
  };
  const out: Candle[] = [];
  let price = 100;
  const start = new Date(2020, 0, 2);
  for (let i = 0; i < n; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    if (d.getDay() === 0) d.setDate(d.getDate() + 1);
    if (d.getDay() === 6) d.setDate(d.getDate() + 2);
    const chg = 0.0003 + rng() * 0.018;
    price = Math.max(price * (1 + chg), 0.01);
    const range = price * (0.005 + Math.abs(rng()) * 0.01);
    const open = price * (1 + rng() * 0.003);
    out.push({
      date: d.toISOString().slice(0, 10),
      open,
      high: Math.max(open, price) + range * 0.5,
      low: Math.min(open, price) - range * 0.5,
      close: price,
      volume: Math.round(1_000_000 + Math.abs(rng()) * 5_000_000),
    });
  }
  return out;
}

interface StrategyResult {
  label: string;
  trades: ClosedTrade[];
  equityPoints: EquityPoint[];
  finalEquity: number;
  totalReturnPct: number;
  annReturn: number;
  dd: number;
  winRate: number;
  profitFactor: number;
  tradeCount: number;
}

function runStrategy(
  candles: Candle[],
  fast: number,
  slow: number,
  capital: number,
  label: string,
): StrategyResult {
  const local = runSmaCrossoverLocal(candles, fast, slow, capital);
  return {
    label,
    trades: local.trades,
    equityPoints: local.equityPoints,
    finalEquity: local.finalEquity,
    totalReturnPct: local.totalReturnPct,
    annReturn: local.annReturn,
    dd: local.maxDrawdown,
    winRate: local.stats.winRate,
    profitFactor: local.stats.profitFactor,
    tradeCount: local.stats.trades,
  };
}

function renderDualEquitySVG(a: EquityPoint[], b: EquityPoint[]): string {
  const aVals = a.map((p) => p.equity);
  const bVals = b.map((p) => p.equity);
  const maxLen = Math.max(aVals.length, bVals.length);
  if (maxLen < 2) return "<p class='empty-state'>No data.</p>";

  const W = 560;
  const H = 140;
  const all = [...aVals, ...bVals];
  const yMin = Math.min(...all);
  const yMax = Math.max(...all);
  const yRange = yMax - yMin || 1;
  const xScale = (i: number, len: number): number => (i / (len - 1)) * W;
  const yScale = (v: number): number => H - ((v - yMin) / yRange) * (H - 12) - 6;

  const ptsA = aVals
    .map((v, i) => `${xScale(i, aVals.length).toFixed(1)},${yScale(v).toFixed(1)}`)
    .join(" ");
  const ptsB = bVals
    .map((v, i) => `${xScale(i, bVals.length).toFixed(1)},${yScale(v).toFixed(1)}`)
    .join(" ");

  return `
    <svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" aria-label="Strategy comparison equity curves">
      <polyline fill="none" stroke="var(--accent, #58a6ff)" stroke-width="2" stroke-linejoin="round" points="${ptsA}" />
      <polyline fill="none" stroke="var(--signal-sell, #f85149)" stroke-width="2" stroke-linejoin="round" stroke-dasharray="6 3" points="${ptsB}" />
    </svg>
    <div class="comparison-legend">
      <span class="legend-a">━ Strategy A</span>
      <span class="legend-b">┈ Strategy B</span>
    </div>`;
}

function renderComparisonTable(a: StrategyResult, b: StrategyResult): string {
  const fmt = (v: number, suffix = "%"): string => `${v >= 0 ? "+" : ""}${v.toFixed(1)}${suffix}`;
  const fmtDd = (v: number): string => `−${(v * 100).toFixed(1)}%`;
  const fmtPf = (v: number): string => (v === Infinity ? "∞" : v.toFixed(2));

  return `
    <table class="data-table comparison-stats-table">
      <thead>
        <tr><th>Metric</th><th>${a.label}</th><th>${b.label}</th><th>Δ</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>Total Return</td>
          <td class="${a.totalReturnPct >= 0 ? "text-positive" : "text-negative"}">${fmt(a.totalReturnPct)}</td>
          <td class="${b.totalReturnPct >= 0 ? "text-positive" : "text-negative"}">${fmt(b.totalReturnPct)}</td>
          <td>${fmt(a.totalReturnPct - b.totalReturnPct)}</td>
        </tr>
        <tr>
          <td>CAGR</td>
          <td>${fmt(a.annReturn * 100)}</td>
          <td>${fmt(b.annReturn * 100)}</td>
          <td>${fmt((a.annReturn - b.annReturn) * 100)}</td>
        </tr>
        <tr>
          <td>Max Drawdown</td>
          <td class="${a.dd <= 0.15 ? "text-positive" : "text-negative"}">${fmtDd(a.dd)}</td>
          <td class="${b.dd <= 0.15 ? "text-positive" : "text-negative"}">${fmtDd(b.dd)}</td>
          <td>${fmtDd(a.dd - b.dd)}</td>
        </tr>
        <tr>
          <td>Win Rate</td>
          <td>${(a.winRate * 100).toFixed(1)}%</td>
          <td>${(b.winRate * 100).toFixed(1)}%</td>
          <td>${fmt((a.winRate - b.winRate) * 100)}</td>
        </tr>
        <tr>
          <td>Profit Factor</td>
          <td>${fmtPf(a.profitFactor)}</td>
          <td>${fmtPf(b.profitFactor)}</td>
          <td>${fmtPf(a.profitFactor - b.profitFactor)}</td>
        </tr>
        <tr>
          <td>Trades</td>
          <td>${a.tradeCount}</td>
          <td>${b.tradeCount}</td>
          <td>${a.tradeCount - b.tradeCount}</td>
        </tr>
      </tbody>
    </table>`;
}

function mount(
  container: HTMLElement,
  ctx: CardContext,
): { update(ctx: CardContext): void; dispose(): void } {
  const initialTicker = ctx.params["symbol"] ?? "AAPL";
  let ticker = initialTicker;
  let candles: Candle[] = syntheticCandles(500);
  const capital = 10_000;

  container.innerHTML = `
    <div class="strategy-comparison-layout">
      <form class="backtest-controls" id="cmp-form" onsubmit="return false">
        <div class="backtest-control-row">
          <label class="backtest-label">Ticker
            <input id="cmp-ticker" type="text" class="input backtest-input" value="${ticker}" maxlength="10" />
          </label>
        </div>
        <fieldset class="strategy-fieldset">
          <legend>Strategy A</legend>
          <label>Fast MA <input id="cmp-a-fast" type="number" class="input backtest-input" value="10" min="2" max="50" /></label>
          <label>Slow MA <input id="cmp-a-slow" type="number" class="input backtest-input" value="30" min="5" max="200" /></label>
        </fieldset>
        <fieldset class="strategy-fieldset">
          <legend>Strategy B</legend>
          <label>Fast MA <input id="cmp-b-fast" type="number" class="input backtest-input" value="5" min="2" max="50" /></label>
          <label>Slow MA <input id="cmp-b-slow" type="number" class="input backtest-input" value="50" min="5" max="200" /></label>
        </fieldset>
        <button data-action="run-comparison" type="button" class="btn btn-primary">▶ Compare</button>
        <p class="risk-hint" id="cmp-source">Loading…</p>
      </form>
      <div id="cmp-result"></div>
    </div>`;

  const resultEl = container.querySelector<HTMLElement>("#cmp-result")!;
  const sourceHint = container.querySelector<HTMLElement>("#cmp-source")!;

  async function loadCandles(): Promise<void> {
    try {
      const data = await fetchTickerData(ticker, getNavigationSignal());
      if (data.candles.length >= 30) {
        candles = data.candles.map((c) => ({
          date: c.date,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volume,
        }));
        sourceHint.textContent = `${ticker} · ${candles.length} candles · $${capital.toLocaleString()}`;
      } else {
        candles = syntheticCandles(500);
        sourceHint.textContent = `Synthetic data (fetch returned < 30 candles)`;
      }
    } catch {
      candles = syntheticCandles(500);
      sourceHint.textContent = `Synthetic data (fetch failed)`;
    }
  }

  function runComparison(): void {
    const aFast = parseInt(
      container.querySelector<HTMLInputElement>("#cmp-a-fast")?.value ?? "10",
      10,
    );
    const aSlow = parseInt(
      container.querySelector<HTMLInputElement>("#cmp-a-slow")?.value ?? "30",
      10,
    );
    const bFast = parseInt(
      container.querySelector<HTMLInputElement>("#cmp-b-fast")?.value ?? "5",
      10,
    );
    const bSlow = parseInt(
      container.querySelector<HTMLInputElement>("#cmp-b-slow")?.value ?? "50",
      10,
    );

    const a = runStrategy(candles, aFast, aSlow, capital, `SMA(${aFast}/${aSlow})`);
    const b = runStrategy(candles, bFast, bSlow, capital, `SMA(${bFast}/${bSlow})`);

    const winner = a.totalReturnPct >= b.totalReturnPct ? "A" : "B";
    const html = `
      <div class="comparison-chart-wrap">${renderDualEquitySVG(a.equityPoints, b.equityPoints)}</div>
      <p class="comparison-winner">Winner: <strong>Strategy ${winner}</strong> (${winner === "A" ? a.label : b.label})</p>
      ${renderComparisonTable(a, b)}`;
    patchDOM(resultEl, html);
  }

  const delegate = createDelegate(container, {
    "run-comparison": () => {
      const newTicker =
        container.querySelector<HTMLInputElement>("#cmp-ticker")?.value.trim().toUpperCase() ||
        "AAPL";
      if (newTicker !== ticker) {
        ticker = newTicker;
        sourceHint.textContent = `Loading ${ticker}…`;
        void loadCandles().then(runComparison);
      } else {
        runComparison();
      }
    },
  });

  // Initial load
  void loadCandles().then(runComparison);

  return {
    update(newCtx: CardContext): void {
      const t = newCtx.params["symbol"] ?? "AAPL";
      if (t !== ticker) {
        ticker = t;
        container.querySelector<HTMLInputElement>("#cmp-ticker")!.value = ticker;
        void loadCandles().then(runComparison);
      }
    },
    dispose(): void {
      delegate.dispose();
    },
  };
}

const strategyComparisonCard: CardModule = { mount };

export default strategyComparisonCard;
