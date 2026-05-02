/**
 * Chart card adapter — CardModule wrapper for the chart view.
 *
 * Renders the HTML summary header via `renderChart`, then progressively
 * enhances the chart area with a full Lightweight Charts candlestick chart
 * (multi-pane: price + SMA + signal markers | volume) loaded via dynamic
 * import so the ~40 KB gz LWC bundle only lands in this route's chunk.
 */
import { renderChart } from "./chart";
import { attachLwChart, type LwChartHandle } from "./lw-chart";
import { runBacktestAsync } from "../core/backtest-worker";
import { fetchTickerData } from "../core/data-service";
import { showToast } from "../ui/toast";
import { getNavigationSignal } from "../ui/router";
import type { CardModule, CardContext } from "./registry";
import type { BacktestConfig } from "../domain/backtest-engine";

function defaultBacktestConfig(ticker: string): BacktestConfig {
  return {
    ticker,
    initialCapital: 10_000,
    methods: ["RSI", "MACD", "Bollinger"],
    windowSize: 50,
  };
}

function renderBacktestUI(container: HTMLElement, ticker: string): void {
  let section = container.querySelector<HTMLElement>(".backtest-section");
  if (!section) {
    section = document.createElement("div");
    section.className = "backtest-section";
    container.appendChild(section);
  }

  section.innerHTML = `
    <button class="btn btn-sm" id="btn-run-backtest" ${!ticker ? "disabled" : ""}>
      Run Backtest (Worker)
    </button>
    <div id="backtest-result" class="backtest-result"></div>
  `;

  const btn = section.querySelector<HTMLButtonElement>("#btn-run-backtest")!;
  const resultDiv = section.querySelector<HTMLElement>("#backtest-result")!;

  btn.addEventListener("click", (): void => {
    if (!ticker) return;
    btn.disabled = true;
    btn.textContent = "Running…";
    resultDiv.textContent = "";

    void (async (): Promise<void> => {
      try {
        const data = await fetchTickerData(ticker, getNavigationSignal());
        if (!data.candles || data.candles.length < 30) {
          resultDiv.textContent = "Insufficient data (need 30+ candles).";
          return;
        }
        const t0 = performance.now();
        const result = await runBacktestAsync(defaultBacktestConfig(ticker), data.candles);
        const elapsed = (performance.now() - t0).toFixed(0);

        resultDiv.innerHTML = `
          <table class="mini-table">
            <tr><td>Trades</td><td>${result.trades.length}</td></tr>
            <tr><td>Total Return</td><td>${result.totalReturnPercent.toFixed(2)}%</td></tr>
            <tr><td>Win Rate</td><td>${(result.winRate * 100).toFixed(1)}%</td></tr>
            <tr><td>Max Drawdown</td><td>${(result.maxDrawdown * 100).toFixed(2)}%</td></tr>
            <tr><td>Computed in</td><td>${elapsed} ms (Worker)</td></tr>
          </table>
        `;
        showToast({
          message: `Backtest done: ${result.trades.length} trades in ${elapsed}ms`,
          type: "success",
        });
      } catch (err) {
        resultDiv.textContent = `Error: ${(err as Error).message}`;
        showToast({ message: "Backtest failed", type: "error" });
      } finally {
        btn.disabled = false;
        btn.textContent = "Run Backtest (Worker)";
      }
    })();
  });
}

/** Fetch data, render HTML summary, then enhance with a real LWC chart. */
async function renderChartWithData(
  container: HTMLElement,
  ticker: string,
  lwHandle: { current: LwChartHandle | null },
): Promise<void> {
  // Dispose previous LWC instance before re-rendering
  lwHandle.current?.dispose();
  lwHandle.current = null;

  if (!ticker) {
    renderChart(container, { ticker: "", candles: [] });
    return;
  }

  // Show a quick skeleton while fetching
  renderChart(container, { ticker, candles: [] });

  try {
    const data = await fetchTickerData(ticker, getNavigationSignal());
    const candles = data.candles ?? [];

    // Re-render the HTML header with real data
    renderChart(container, { ticker, candles });

    // Replace the static OHLC table with a real interactive LWC chart
    const canvasEl = container.querySelector<HTMLElement>(".chart-canvas");
    if (canvasEl && candles.length > 0) {
      canvasEl.innerHTML = "";
      canvasEl.style.height = "400px";
      lwHandle.current = await attachLwChart(canvasEl, { ticker, candles });
    }
  } catch (err) {
    // Leave the HTML header visible; log the error
    console.warn("Chart data fetch failed:", err);
  }
}

const chartCard: CardModule = {
  mount(container, ctx) {
    const ticker = ctx.params["symbol"] ?? "";
    const lwHandle: { current: LwChartHandle | null } = { current: null };

    void renderChartWithData(container, ticker, lwHandle);
    renderBacktestUI(container, ticker);

    return {
      update(newCtx: CardContext): void {
        const t = newCtx.params["symbol"] ?? "";
        void renderChartWithData(container, t, lwHandle);
        renderBacktestUI(container, t);
      },
      dispose(): void {
        lwHandle.current?.dispose();
        lwHandle.current = null;
      },
    };
  },
};

export default chartCard;
