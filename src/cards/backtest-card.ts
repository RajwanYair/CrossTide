/**
 * Backtest UI card — interactive parameter controls that run a
 * consensus-based backtest against real OHLCV data (via data-service)
 * or a synthetic fallback, rendering equity curve + trade log + stats.
 *
 * Domain wiring:
 *   buildEquityCurve + summarizeTrades  ← src/domain/equity-curve.ts
 *   maxDrawdown + cagr                  ← src/domain/risk-ratios.ts
 *   runBacktestAsync                    ← src/core/backtest-worker.ts (Web Worker)
 *
 * Data sourcing:
 *   fetchTickerData                     ← src/core/data-service.ts (real candles)
 *   syntheticCandles (local)            ← fallback when fetch fails
 *
 * A5: Computation is offloaded to a Web Worker via worker-rpc, keeping
 *     the main thread responsive during long backtests.
 */
import {
  summarizeTrades,
  type ClosedTrade,
  type EquityPoint,
  type buildEquityCurve,
} from "../domain/equity-curve";
import { cagr } from "../domain/risk-ratios";
import { runBacktestAsync } from "../core/backtest-worker";
import { fetchTickerData } from "../core/data-service";
import { getNavigationSignal } from "../ui/router";
import type { CardContext, CardModule } from "./registry";
import { patchDOM } from "../core/patch-dom";

// ── Synthetic price generator ─────────────────────────────────────────────────
function syntheticCandles(
  n: number,
  seed = 7,
): Array<{ date: string; open: number; high: number; low: number; close: number; volume: number }> {
  let state = seed;
  const rng = (): number => {
    state = (state * 1664525 + 1013904223) & 0xffffffff;
    return ((state >>> 0) / 0x100000000 - 0.5) * 2;
  };

  const out = [];
  let price = 100;
  const start = new Date(2020, 0, 2);

  for (let i = 0; i < n; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    // Skip weekends for realism
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

// ── SVG equity curve ──────────────────────────────────────────────────────────
function renderEquitySVG(equityPoints: ReturnType<typeof buildEquityCurve>): string {
  const values = equityPoints.map((p) => p.equity);
  if (values.length < 2) return "<p class='empty-state'>No trades generated.</p>";

  const W = 560;
  const H = 120;
  const yMin = Math.min(...values);
  const yMax = Math.max(...values);
  const yRange = yMax - yMin || 1;
  const xScale = (i: number): number => (i / (values.length - 1)) * W;
  const yScale = (v: number): number => H - ((v - yMin) / yRange) * (H - 8) - 4;

  const pts = values.map((v, i) => `${xScale(i).toFixed(1)},${yScale(v).toFixed(1)}`).join(" ");
  const isProfit = (values[values.length - 1] ?? 0) >= (values[0] ?? 0);
  const stroke = isProfit ? "var(--positive, #3fb950)" : "var(--negative, #f85149)";

  // Zero-line (initial capital)
  const initY = yScale(values[0]!);
  return `
    <svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" aria-label="Equity curve">
      <line x1="0" y1="${initY.toFixed(1)}" x2="${W}" y2="${initY.toFixed(1)}"
            stroke="var(--border)" stroke-width="1" stroke-dasharray="4 3" />
      <polyline fill="none" stroke="${stroke}" stroke-width="2" stroke-linejoin="round" points="${pts}" />
    </svg>`;
}

// ── Trade log ─────────────────────────────────────────────────────────────────
function renderTradeLog(
  trades: ClosedTrade[],
  candles: ReturnType<typeof syntheticCandles>,
): string {
  if (trades.length === 0) return "<p class='empty-state'>No trades in this period.</p>";
  const recent = trades.slice(-10).reverse();
  const rows = recent
    .map((t) => {
      const pnl = (t.exitPrice - t.entryPrice) * (t.quantity ?? 1);
      const pct = ((t.exitPrice - t.entryPrice) / t.entryPrice) * 100;
      const cls = pnl >= 0 ? "badge badge-positive" : "badge badge-negative";
      const sign = pnl >= 0 ? "+" : "";
      return `<tr>
        <td>${candles[t.entryTime]?.date ?? "—"}</td>
        <td>${candles[t.exitTime]?.date ?? "—"}</td>
        <td class="num">$${t.entryPrice.toFixed(2)}</td>
        <td class="num">$${t.exitPrice.toFixed(2)}</td>
        <td class="num"><span class="${cls}">${sign}${pct.toFixed(1)}%</span></td>
      </tr>`;
    })
    .join("");
  return `
    <div style="overflow-x:auto">
      <table class="data-table backtest-trade-log">
        <thead>
          <tr>
            <th>Entry</th><th>Exit</th>
            <th class="num">Entry $</th><th class="num">Exit $</th>
            <th class="num">Return</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    ${trades.length > 10 ? `<p class="risk-hint">${trades.length - 10} earlier trades not shown.</p>` : ""}`;
}

// ── Main render ───────────────────────────────────────────────────────────────
type Candle = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

function renderBacktestCard(container: HTMLElement, initialTicker = "AAPL"): void {
  let fastPeriod = 10;
  let slowPeriod = 30;
  let ticker = initialTicker;
  const initialCapital = 10_000;

  let CANDLES: Candle[] = syntheticCandles(500);
  let dataSource: "real" | "synthetic" = "synthetic";

  /** Fetch real candles for the selected ticker; fall back to synthetic. */
  async function loadCandles(): Promise<void> {
    try {
      const data = await fetchTickerData(ticker, getNavigationSignal());
      if (data.candles.length >= 30) {
        CANDLES = data.candles.map(
          (c: {
            date: string;
            open: number;
            high: number;
            low: number;
            close: number;
            volume: number;
          }) => ({
            date: c.date,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
            volume: c.volume,
          }),
        );
        dataSource = "real";
      } else {
        CANDLES = syntheticCandles(500);
        dataSource = "synthetic";
      }
    } catch {
      CANDLES = syntheticCandles(500);
      dataSource = "synthetic";
    }
  }

  const run = async (): Promise<void> => {
    const resultEl = container.querySelector<HTMLElement>("#backtest-result");
    if (resultEl) resultEl.innerHTML = `<p class="empty-state">Computing…</p>`;

    const result = await runBacktestAsync(
      { ticker: "SYNTH", initialCapital, methods: [], windowSize: slowPeriod },
      CANDLES.map((c) => ({ ...c, date: c.date })),
    ).catch(() => null);

    // Fallback: if worker unavailable, compute locally (import dynamically)
    let trades: ClosedTrade[];
    let equityPoints: EquityPoint[];
    let stats: ReturnType<typeof summarizeTrades>;
    let dd: number;
    let annReturn: number;
    let finalEquity: number;
    let totalRetPct: number;

    if (result) {
      // Domain engine result — map to our display format
      trades = result.trades.map((t, i) => ({
        entryTime: i * 2,
        exitTime: i * 2 + 1,
        entryPrice: t.entryPrice,
        exitPrice: t.exitPrice,
        side: "long" as const,
      }));
      equityPoints = result.equityCurve.map((p, i) => ({
        time: i,
        equity: p.equity,
        pnl: i === 0 ? 0 : p.equity - result.equityCurve[i - 1]!.equity,
      }));
      const equityValues = equityPoints.map((p) => p.equity);
      stats = summarizeTrades(trades);
      dd = result.maxDrawdown;
      const years = CANDLES.length / 252;
      annReturn = cagr(equityValues, years);
      finalEquity = equityValues[equityValues.length - 1] ?? initialCapital;
      totalRetPct = result.totalReturnPercent;
    } else {
      // Direct fallback (worker not available)
      const { runSmaCrossoverLocal } = await import("../core/backtest-worker-fallback");
      const local = runSmaCrossoverLocal(CANDLES, fastPeriod, slowPeriod, initialCapital);
      trades = local.trades;
      equityPoints = local.equityPoints;
      stats = local.stats;
      dd = local.maxDrawdown;
      annReturn = local.annReturn;
      finalEquity = local.finalEquity;
      totalRetPct = local.totalReturnPct;
    }

    const totalPnl = finalEquity - initialCapital;

    const statsHtml = `
      <div class="portfolio-summary-row">
        <div class="portfolio-summary-stat">
          <span class="stat-label">Final Capital</span>
          <span class="stat-value ${totalPnl >= 0 ? "text-positive" : "text-negative"}">
            $${finalEquity.toFixed(0)}
          </span>
        </div>
        <div class="portfolio-summary-stat">
          <span class="stat-label">Total Return</span>
          <span class="stat-value ${totalPnl >= 0 ? "text-positive" : "text-negative"}">
            ${totalRetPct >= 0 ? "+" : ""}${totalRetPct.toFixed(1)}%
          </span>
        </div>
        <div class="portfolio-summary-stat">
          <span class="stat-label">CAGR</span>
          <span class="stat-value">${(annReturn * 100).toFixed(1)}%</span>
        </div>
        <div class="portfolio-summary-stat">
          <span class="stat-label">Max Drawdown</span>
          <span class="stat-value ${dd <= 0.15 ? "text-positive" : "text-negative"}">
            −${(dd * 100).toFixed(1)}%
          </span>
        </div>
        <div class="portfolio-summary-stat">
          <span class="stat-label">Trades</span>
          <span class="stat-value">${stats.trades}</span>
        </div>
        <div class="portfolio-summary-stat">
          <span class="stat-label">Win Rate</span>
          <span class="stat-value ${stats.winRate >= 0.5 ? "text-positive" : "text-negative"}">
            ${(stats.winRate * 100).toFixed(1)}%
          </span>
        </div>
        <div class="portfolio-summary-stat">
          <span class="stat-label">Profit Factor</span>
          <span class="stat-value ${stats.profitFactor >= 1 ? "text-positive" : "text-negative"}">
            ${stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2)}
          </span>
        </div>
      </div>`;

    // Update result area only (controls are static)
    if (resultEl) {
      patchDOM(
        resultEl,
        `
        <div class="backtest-equity-wrap">${renderEquitySVG(equityPoints)}</div>
        ${statsHtml}
        <div class="backtest-tradelog-wrap">
          <h3 class="section-subtitle">Recent Trades (last 10)</h3>
          ${renderTradeLog(trades, CANDLES)}
        </div>`,
      );
    }
  };

  container.innerHTML = `
    <div class="backtest-layout">

      <!-- Controls -->
      <form class="backtest-controls" id="backtest-form" onsubmit="return false">
        <div class="backtest-control-row">
          <label class="backtest-label">
            Ticker
            <input id="bt-ticker" type="text" class="input backtest-input"
                   value="${ticker}" placeholder="AAPL" maxlength="10" />
          </label>
          <label class="backtest-label">
            Fast MA
            <input id="bt-fast" type="number" class="input backtest-input"
                   min="2" max="50" value="${fastPeriod}" />
          </label>
          <label class="backtest-label">
            Slow MA
            <input id="bt-slow" type="number" class="input backtest-input"
                   min="5" max="200" value="${slowPeriod}" />
          </label>
          <button id="bt-run" type="button" class="btn btn-primary">▶ Run</button>
        </div>
        <p class="risk-hint" id="bt-source">Loading real data for <strong>${ticker}</strong>…</p>
      </form>

      <!-- Result area -->
      <div id="backtest-result"></div>

    </div>`;

  // Wire controls
  const form = container.querySelector<HTMLFormElement>("#backtest-form")!;
  const runBtn = form.querySelector<HTMLButtonElement>("#bt-run")!;
  const fastInput = form.querySelector<HTMLInputElement>("#bt-fast")!;
  const slowInput = form.querySelector<HTMLInputElement>("#bt-slow")!;
  const tickerInput = form.querySelector<HTMLInputElement>("#bt-ticker")!;
  const sourceHint = form.querySelector<HTMLElement>("#bt-source")!;

  const updateSourceHint = (): void => {
    if (dataSource === "real") {
      sourceHint.innerHTML = `<strong>${ticker}</strong> · ${CANDLES.length} real candles · MA crossover · $${initialCapital.toLocaleString()} capital`;
    } else {
      sourceHint.innerHTML = `Synthetic 500-day series (fetch failed) · MA crossover · $${initialCapital.toLocaleString()} capital`;
    }
  };

  const onRun = async (): Promise<void> => {
    // Read ticker
    const newTicker = tickerInput.value.trim().toUpperCase() || "AAPL";
    tickerInput.value = newTicker;

    fastPeriod = Math.max(2, Math.min(50, parseInt(fastInput.value, 10) || fastPeriod));
    slowPeriod = Math.max(
      fastPeriod + 1,
      Math.min(200, parseInt(slowInput.value, 10) || slowPeriod),
    );
    // Clamp slow > fast
    if (slowPeriod <= fastPeriod) {
      slowPeriod = fastPeriod + 1;
      slowInput.value = String(slowPeriod);
    }

    // Fetch fresh candles if ticker changed
    if (newTicker !== ticker || dataSource === "synthetic") {
      ticker = newTicker;
      sourceHint.innerHTML = `Loading real data for <strong>${ticker}</strong>…`;
      await loadCandles();
      updateSourceHint();
    }

    void run();
  };

  runBtn.addEventListener("click", () => void onRun());

  // Initial load: fetch real data then run
  void loadCandles().then(() => {
    updateSourceHint();
    void run();
  });
}

const backtestCard: CardModule = {
  mount(container, ctx) {
    const ticker = ctx.params["symbol"] ?? "AAPL";
    renderBacktestCard(container, ticker);
    return {
      update(newCtx: CardContext): void {
        const t = newCtx.params["symbol"] ?? "AAPL";
        renderBacktestCard(container, t);
      },
    };
  },
};

export default backtestCard;
