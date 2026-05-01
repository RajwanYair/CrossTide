/**
 * Backtest UI card — interactive parameter controls that run a
 * consensus-based backtest against a synthetic OHLCV dataset and
 * render the equity curve + trade log + summary stats.
 *
 * Domain wiring:
 *   buildEquityCurve + summarizeTrades  ← src/domain/equity-curve.ts
 *   maxDrawdown + cagr                  ← src/domain/risk-ratios.ts
 *
 * The synthetic price series is generated deterministically so results
 * are reproducible without a live data connection.
 */
import { buildEquityCurve, summarizeTrades, type ClosedTrade } from "../domain/equity-curve";
import { maxDrawdown, cagr } from "../domain/risk-ratios";
import type { CardModule } from "./registry";

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

// ── Simple MA crossover backtest ──────────────────────────────────────────────
interface BacktestParams {
  fastPeriod: number;
  slowPeriod: number;
  initialCapital: number;
}

function sma(prices: readonly number[], n: number, i: number): number {
  let s = 0;
  for (let k = i - n + 1; k <= i; k++) s += prices[k]!;
  return s / n;
}

function runBacktest(
  candles: ReturnType<typeof syntheticCandles>,
  params: BacktestParams,
): { trades: ClosedTrade[]; equityPoints: ReturnType<typeof buildEquityCurve> } {
  const closes = candles.map((c) => c.close);
  const { fastPeriod, slowPeriod, initialCapital } = params;
  const trades: ClosedTrade[] = [];
  let position: { entryTime: number; entryPrice: number } | null = null;

  for (let i = slowPeriod; i < closes.length; i++) {
    const fast = sma(closes, fastPeriod, i);
    const fastPrev = sma(closes, fastPeriod, i - 1);
    const slow = sma(closes, slowPeriod, i);
    const slowPrev = sma(closes, slowPeriod, i - 1);

    const crossUp = fastPrev <= slowPrev && fast > slow;
    const crossDown = fastPrev >= slowPrev && fast < slow;

    if (!position && crossUp) {
      position = { entryTime: i, entryPrice: closes[i]! };
    } else if (position && crossDown) {
      trades.push({
        entryTime: position.entryTime,
        exitTime: i,
        entryPrice: position.entryPrice,
        exitPrice: closes[i]!,
        side: "long",
      });
      position = null;
    }
  }

  // Close open position at end
  if (position) {
    trades.push({
      entryTime: position.entryTime,
      exitTime: closes.length - 1,
      entryPrice: position.entryPrice,
      exitPrice: closes[closes.length - 1]!,
      side: "long",
    });
  }

  const equityPoints = buildEquityCurve(trades, initialCapital);
  return { trades, equityPoints };
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
  const xScale = (i: number) => (i / (values.length - 1)) * W;
  const yScale = (v: number) => H - ((v - yMin) / yRange) * (H - 8) - 4;

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
function renderBacktestCard(container: HTMLElement): void {
  let fastPeriod = 10;
  let slowPeriod = 30;
  const initialCapital = 10_000;

  const CANDLES = syntheticCandles(500);

  const run = (): void => {
    const { trades, equityPoints } = runBacktest(CANDLES, {
      fastPeriod,
      slowPeriod,
      initialCapital,
    });

    const stats = summarizeTrades(trades);
    const equityValues = equityPoints.map((p) => p.equity);
    const dd = maxDrawdown(equityValues);
    const years = CANDLES.length / 252;
    const annReturn = cagr(equityValues, years);
    const finalEquity = equityValues[equityValues.length - 1] ?? initialCapital;
    const totalPnl = finalEquity - initialCapital;
    const totalRetPct = (totalPnl / initialCapital) * 100;

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
    const resultEl = container.querySelector<HTMLElement>("#backtest-result");
    if (resultEl) {
      resultEl.innerHTML = `
        <div class="backtest-equity-wrap">${renderEquitySVG(equityPoints)}</div>
        ${statsHtml}
        <div class="backtest-tradelog-wrap">
          <h3 class="section-subtitle">Recent Trades (last 10)</h3>
          ${renderTradeLog(trades, CANDLES)}
        </div>`;
    }
  };

  container.innerHTML = `
    <div class="backtest-layout">

      <!-- Controls -->
      <form class="backtest-controls" id="backtest-form" onsubmit="return false">
        <div class="backtest-control-row">
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
        <p class="risk-hint">Synthetic 500-day OHLCV series · MA crossover strategy · $${initialCapital.toLocaleString()} starting capital</p>
      </form>

      <!-- Result area -->
      <div id="backtest-result"></div>

    </div>`;

  // Wire controls
  const form = container.querySelector<HTMLFormElement>("#backtest-form")!;
  const runBtn = form.querySelector<HTMLButtonElement>("#bt-run")!;
  const fastInput = form.querySelector<HTMLInputElement>("#bt-fast")!;
  const slowInput = form.querySelector<HTMLInputElement>("#bt-slow")!;

  const onRun = (): void => {
    fastPeriod = Math.max(2, Math.min(50, parseInt(fastInput.value, 10) || fastPeriod));
    slowPeriod = Math.max(fastPeriod + 1, Math.min(200, parseInt(slowInput.value, 10) || slowPeriod));
    // Clamp slow > fast
    if (slowPeriod <= fastPeriod) {
      slowPeriod = fastPeriod + 1;
      slowInput.value = String(slowPeriod);
    }
    run();
  };

  runBtn.addEventListener("click", onRun);
  // Run immediately with defaults
  run();
}

const backtestCard: CardModule = {
  mount(container, _ctx) {
    renderBacktestCard(container);
    return {};
  },
};

export default backtestCard;
