/**
 * Chart card adapter — CardModule wrapper for the chart view.
 *
 * Renders the HTML summary header via `renderChart`, then progressively
 * enhances the chart area with a full Lightweight Charts candlestick chart
 * (multi-pane: price + SMA + signal markers | volume) loaded via dynamic
 * import so the ~40 KB gz LWC bundle only lands in this route's chunk.
 */
import { renderChart } from "./chart";
import { renderFundamentalsOverlay } from "./fundamental-overlay";
import { attachLwChart, type LwChartHandle } from "./lw-chart";
import { mountDrawingTools, type DrawingToolHandle } from "./drawing-tools";
import { saveDrawings, loadDrawings } from "./drawing-persistence";
import { runBacktestAsync } from "../core/backtest-worker";
import { fetchTickerData } from "../core/data-service";
import { TIMEFRAME_PRESETS, DEFAULT_TIMEFRAME, type TimeframePreset } from "../core/data-service";
import { fetchFundamentals } from "../domain/fundamental-data";
import { showToast } from "../ui/toast";
import { getNavigationSignal } from "../ui/router";
import { patchDOM } from "../core/patch-dom";
import { createDelegate } from "../ui/delegate";
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

  patchDOM(
    section,
    `
    <button class="btn btn-sm" data-action="run-backtest" ${!ticker ? "disabled" : ""}>
      Run Backtest (Worker)
    </button>
    <div id="backtest-result" class="backtest-result"></div>
  `,
  );
}

/** Fetch data, render HTML summary, then enhance with a real LWC chart. */
async function renderChartWithData(
  container: HTMLElement,
  ticker: string,
  lwHandle: { current: LwChartHandle | null },
  timeframe: TimeframePreset = DEFAULT_TIMEFRAME,
  drawingRef?: { current: DrawingToolHandle | null; ticker: string },
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
    const data = await fetchTickerData(ticker, getNavigationSignal(), undefined, timeframe);
    const candles = data.candles ?? [];

    // Re-render the HTML header with real data
    renderChart(container, { ticker, candles });

    // Fetch and render fundamental data overlay (non-blocking)
    const signal = getNavigationSignal();
    void fetchFundamentals(ticker, signal).then((fundamentals) => {
      if (signal?.aborted) return;
      const html = renderFundamentalsOverlay(fundamentals);
      if (!html) return;
      const overlay = container.querySelector<HTMLElement>(".fundamental-overlay");
      if (overlay) {
        overlay.outerHTML = html;
      } else {
        const chartCanvas = container.querySelector(".chart-canvas");
        if (chartCanvas) {
          chartCanvas.insertAdjacentHTML("beforebegin", html);
        }
      }
    });

    // Replace the static OHLC table with a real interactive LWC chart
    const canvasEl = container.querySelector<HTMLElement>(".chart-canvas");
    if (canvasEl && candles.length > 0) {
      canvasEl.innerHTML = "";
      canvasEl.style.height = "400px";
      lwHandle.current = await attachLwChart(canvasEl, { ticker, candles });

      // Mount drawing tools overlay and restore persisted drawings
      if (drawingRef) {
        drawingRef.current?.dispose();
        const drawingHandle = mountDrawingTools(canvasEl);
        const saved = loadDrawings(ticker);
        if (saved.length > 0) drawingHandle.setDrawings(saved);
        drawingRef.current = drawingHandle;
      }
    }
  } catch (err) {
    // Leave the HTML header visible; log the error
    console.warn("Chart data fetch failed:", err);
  }
}

const chartCard: CardModule = {
  mount(container, ctx) {
    let ticker = ctx.params["symbol"] ?? "";
    const lwHandle: { current: LwChartHandle | null } = { current: null };
    const drawingRef: { current: DrawingToolHandle | null; ticker: string } = {
      current: null,
      ticker,
    };
    let activeTimeframe: TimeframePreset = DEFAULT_TIMEFRAME;

    // ── Timeframe selector bar ──
    const tfBar = document.createElement("div");
    tfBar.className = "timeframe-bar";
    tfBar.setAttribute("role", "toolbar");
    tfBar.setAttribute("aria-label", "Chart timeframe");
    for (const preset of TIMEFRAME_PRESETS) {
      const btn = document.createElement("button");
      btn.className = `btn btn-sm timeframe-btn${preset.label === activeTimeframe.label ? " active" : ""}`;
      btn.textContent = preset.label;
      btn.dataset["action"] = "set-timeframe";
      btn.dataset["range"] = preset.range;
      tfBar.appendChild(btn);
    }
    container.prepend(tfBar);

    function runBacktest(): void {
      const btn = container.querySelector<HTMLButtonElement>("[data-action='run-backtest']");
      const resultDiv = container.querySelector<HTMLElement>("#backtest-result");
      if (!btn || !resultDiv || !ticker) return;
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

          patchDOM(
            resultDiv,
            `
            <table class="mini-table">
              <tr><td>Trades</td><td>${result.trades.length}</td></tr>
              <tr><td>Total Return</td><td>${result.totalReturnPercent.toFixed(2)}%</td></tr>
              <tr><td>Win Rate</td><td>${(result.winRate * 100).toFixed(1)}%</td></tr>
              <tr><td>Max Drawdown</td><td>${(result.maxDrawdown * 100).toFixed(2)}%</td></tr>
              <tr><td>Computed in</td><td>${elapsed} ms (Worker)</td></tr>
            </table>
          `,
          );
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
    }

    const delegate = createDelegate(container, {
      "set-timeframe": (el) => {
        const range = el.dataset["range"];
        const preset = TIMEFRAME_PRESETS.find((p) => p.range === range);
        if (!preset) return;
        activeTimeframe = preset;
        tfBar.querySelectorAll(".timeframe-btn").forEach((b) => b.classList.remove("active"));
        el.classList.add("active");
        if (drawingRef.current && drawingRef.ticker) {
          saveDrawings(drawingRef.ticker, drawingRef.current.getDrawings());
        }
        void renderChartWithData(container, ticker, lwHandle, preset, drawingRef);
      },
      "run-backtest": () => runBacktest(),
    });

    void renderChartWithData(container, ticker, lwHandle, activeTimeframe, drawingRef);
    renderBacktestUI(container, ticker);

    return {
      update(newCtx: CardContext): void {
        const t = newCtx.params["symbol"] ?? "";
        // Save drawings for the old ticker before navigating
        if (drawingRef.current && drawingRef.ticker) {
          saveDrawings(drawingRef.ticker, drawingRef.current.getDrawings());
        }
        ticker = t;
        drawingRef.ticker = t;
        void renderChartWithData(container, t, lwHandle, activeTimeframe, drawingRef);
        renderBacktestUI(container, t);
      },
      dispose(): void {
        delegate.dispose();
        // Persist drawings before teardown
        if (drawingRef.current && drawingRef.ticker) {
          saveDrawings(drawingRef.ticker, drawingRef.current.getDrawings());
          drawingRef.current.dispose();
          drawingRef.current = null;
        }
        lwHandle.current?.dispose();
        lwHandle.current = null;
      },
    };
  },
};

export default chartCard;
