/**
 * CrossTide Web — Main entry point.
 *
 * Bootstrap: load config, initialize UI, set up event listeners.
 */
import { loadConfig, saveConfig, addTicker, removeTicker } from "./core/config";
import { registerServiceWorker } from "./core/sw-register";
import { watchServiceWorkerUpdates } from "./core/sw-update";
import { createShortcutManager } from "./core/keyboard";
import { initRouter, navigateTo, onRouteChange, type RouteName } from "./ui/router";
import { initTheme } from "./ui/theme";
import { renderWatchlist, setSortColumn } from "./ui/watchlist";
import { loadCard, type CardHandle, type CardContext } from "./cards/registry";
import { showToast } from "./ui/toast";
import { openPalette, isPaletteOpen } from "./ui/palette-overlay";
import type { PaletteCommand } from "./ui/command-palette";
import { fetchAllTickers, fetchTickerData, type TickerData } from "./core/data-service";
import type { ConsensusResult } from "./types/domain";
import { TieredCache } from "./core/tiered-cache";
import { createStoragePressureMonitor } from "./core/storage-pressure";
import { setScreenerData } from "./cards/screener-data";
import { computeRsiSeries } from "./domain/rsi-calculator";
import { computeSma } from "./domain/sma-calculator";
import type { ScreenerInput } from "./cards/screener";

const cardHandles = new Map<RouteName, CardHandle>();
const cardContainers: Partial<Record<RouteName, string>> = {
  chart: "chart-container",
  alerts: "alerts-container",
  heatmap: "heatmap-container",
  screener: "screener-container",
  "provider-health": "provider-health-container",
};

async function activateCard(
  route: RouteName,
  params: Readonly<Record<string, string>>,
): Promise<void> {
  const containerId = cardContainers[route];
  if (!containerId) return;
  const el = document.getElementById(containerId);
  if (!el) return;
  const ctx: CardContext = { route, params };
  const existing = cardHandles.get(route);
  if (existing) {
    existing.update?.(ctx);
    return;
  }
  try {
    const mod = await loadCard(route);
    const handle = mod.mount(el, ctx);
    if (handle) cardHandles.set(route, handle);
  } catch (err) {
    el.innerHTML = `<p class="empty-state">Failed to load ${route} card.</p>`;
    console.error("Card load failed:", route, err);
  }
}

function main(): void {
  let config = loadConfig();
  let tickerDataCache = new Map<string, TickerData>();
  let refreshTimer: ReturnType<typeof setTimeout> | null = null;

  function updateStatus(text: string): void {
    const el = document.getElementById("sync-status");
    if (el) el.textContent = text;
  }

  async function refreshData(): Promise<void> {
    const tickers = config.watchlist.map((e) => e.ticker);
    if (tickers.length === 0) {
      tickerDataCache.clear();
      renderWatchlist(config, new Map());
      updateStatus("Ready");
      return;
    }

    updateStatus(`Fetching ${tickers.length} ticker(s)…`);

    const results = await fetchAllTickers(tickers, (done, total) => {
      updateStatus(`Loading ${done}/${total}…`);
    });

    tickerDataCache = results;

    // Convert to the format renderWatchlist expects
    const quotesMap = new Map<
      string,
      {
        ticker: string;
        price: number;
        change: number;
        changePercent: number;
        volume: number;
        avgVolume: number;
        high52w: number;
        low52w: number;
        closes30d: readonly number[];
        consensus: ConsensusResult | null;
      }
    >();

    for (const [ticker, data] of results) {
      quotesMap.set(ticker, {
        ticker: data.ticker,
        price: data.price,
        change: data.change,
        changePercent: data.changePercent,
        volume: data.volume,
        avgVolume: data.avgVolume,
        high52w: data.high52w,
        low52w: data.low52w,
        closes30d: data.closes30d,
        consensus: data.consensus,
      });
    }

    renderWatchlist(config, quotesMap);

    // Update screener with live data derived from candles
    const screenerInputs: ScreenerInput[] = [];
    for (const [ticker, data] of results) {
      if (data.error || data.candles.length < 20) continue;
      const rsiSeries = computeRsiSeries(data.candles, 14);
      const lastRsi = rsiSeries.length > 0 ? rsiSeries[rsiSeries.length - 1]!.value : null;
      const volumeRatio = data.avgVolume > 0 ? data.volume / data.avgVolume : 0;
      const sma50 = computeSma(data.candles, 50);
      const sma200 = computeSma(data.candles, 200);
      const smaValues = new Map<number, number | null>([[50, sma50], [200, sma200]]);
      screenerInputs.push({
        ticker,
        price: data.price,
        consensus: data.consensus?.direction ?? "NEUTRAL",
        rsi: lastRsi,
        volumeRatio,
        smaValues,
      });
    }
    setScreenerData(screenerInputs);

    const errors = [...results.values()].filter((d) => d.error);
    if (errors.length > 0 && errors.length < tickers.length) {
      updateStatus(`Updated (${errors.length} failed)`);
    } else if (errors.length === tickers.length) {
      updateStatus("All fetches failed — check network/proxy");
      showToast({
        message: "Could not fetch data. Check browser console for CORS/proxy errors.",
        type: "error",
        durationMs: 8000,
      });
    } else {
      updateStatus(`Updated ${new Date().toLocaleTimeString()}`);
    }
  }

  function scheduleRefresh(): void {
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => void refreshData(), 5 * 60 * 1000); // 5 min
  }

  // Initialize UI
  initTheme(config.theme);
  initRouter();
  renderWatchlist(config, new Map());

  // Fetch live data on startup
  void refreshData().then(() => scheduleRefresh());

  onRouteChange((route, info) => {
    void activateCard(route, info?.params ?? {});
  });

  // Version display
  const versionEl = document.getElementById("app-version");
  if (versionEl) {
    versionEl.textContent = `v${__APP_VERSION__}`;
  }

  // Add ticker on Enter
  const addInput = document.getElementById("add-ticker") as HTMLInputElement | null;
  addInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const ticker = addInput.value.trim().toUpperCase();
      if (!ticker) return;
      if (!/^[A-Z][A-Z0-9.-]{0,9}$/.test(ticker)) {
        showToast({ message: `Invalid ticker: ${ticker}`, type: "error" });
        return;
      }
      if (config.watchlist.some((e) => e.ticker === ticker)) {
        showToast({ message: `${ticker} already in watchlist`, type: "warning" });
        return;
      }
      config = addTicker(config, ticker);
      saveConfig(config);
      renderWatchlist(config, new Map());
      addInput.value = "";
      showToast({ message: `Added ${ticker} — fetching data…`, type: "success" });
      // Fetch data for the new ticker
      void fetchTickerData(ticker).then((data) => {
        tickerDataCache.set(ticker, data);
        void refreshData();
      });
    }
  });

  // Remove ticker via event delegation
  const tbody = document.getElementById("watchlist-body");
  tbody?.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (target.dataset["action"] === "remove") {
      const ticker = target.dataset["ticker"];
      if (ticker) {
        config = removeTicker(config, ticker);
        saveConfig(config);
        renderWatchlist(config, new Map());
        showToast({ message: `Removed ${ticker}`, type: "info" });
      }
    }
  });

  // Column sorting via header click
  const watchlistTable = document.getElementById("watchlist-table");
  watchlistTable?.addEventListener("click", (e) => {
    const th = (e.target as HTMLElement).closest<HTMLElement>("[data-sort]");
    if (!th) return;
    const col = th.dataset["sort"] as "ticker" | "price" | "change" | "consensus" | "volume";
    setSortColumn(col);
    renderWatchlist(config, tickerDataCache);
  });

  // Theme change
  const themeSelect = document.getElementById("theme-select") as HTMLSelectElement | null;
  themeSelect?.addEventListener("change", () => {
    const theme = themeSelect.value as "dark" | "light";
    config = { ...config, theme };
    saveConfig(config);
  });

  // Export watchlist
  document.getElementById("btn-export")?.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(config.watchlist, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "crosstide-watchlist.json";
    a.click();
    URL.revokeObjectURL(url);
    showToast({ message: `Exported ${config.watchlist.length} tickers`, type: "success" });
  });

  // Import watchlist
  document.getElementById("btn-import")?.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        try {
          const parsed = JSON.parse(String(reader.result));
          if (!Array.isArray(parsed)) throw new Error("Expected an array");
          const cleaned: { ticker: string; addedAt: string }[] = [];
          const now = new Date().toISOString();
          for (const raw of parsed) {
            const ticker =
              typeof raw === "string" ? raw : typeof raw?.ticker === "string" ? raw.ticker : null;
            if (ticker && /^[A-Z][A-Z0-9.-]{0,9}$/.test(ticker.toUpperCase())) {
              cleaned.push({ ticker: ticker.toUpperCase(), addedAt: now });
            }
          }
          if (cleaned.length === 0) {
            showToast({ message: "No valid tickers found", type: "warning" });
            return;
          }
          const seen = new Set(config.watchlist.map((e) => e.ticker));
          const merged = [...config.watchlist];
          let added = 0;
          for (const e of cleaned) {
            if (!seen.has(e.ticker)) {
              merged.push(e);
              seen.add(e.ticker);
              added++;
            }
          }
          config = { ...config, watchlist: merged };
          saveConfig(config);
          renderWatchlist(config, new Map());
          showToast({
            message: `Imported ${added} new ticker(s) — fetching data…`,
            type: "success",
          });
          void refreshData();
        } catch (err) {
          showToast({ message: `Import failed: ${(err as Error).message}`, type: "error" });
        }
      });
      reader.readAsText(file);
    });
    input.click();
  });

  // Clear all
  document.getElementById("btn-clear")?.addEventListener("click", () => {
    if (config.watchlist.length === 0) return;
    config = { ...config, watchlist: [] };
    saveConfig(config);
    renderWatchlist(config, new Map());
    showToast({ message: "Watchlist cleared", type: "warning" });
  });

  // Clear cache
  document.getElementById("btn-clear-cache")?.addEventListener("click", () => {
    localStorage.removeItem("crosstide-cache");
    showToast({ message: "Cache cleared", type: "info" });
  });

  // --- Command Palette & Keyboard Shortcuts ---
  const shortcuts = createShortcutManager();
  const paletteCommands: PaletteCommand[] = [
    { id: "nav-watchlist", label: "Go to Watchlist", hint: "G W", section: "Navigation", run: () => navigateTo("watchlist") },
    { id: "nav-consensus", label: "Go to Consensus", hint: "G C", section: "Navigation", run: () => navigateTo("consensus") },
    { id: "nav-chart", label: "Go to Chart", hint: "G H", section: "Navigation", run: () => navigateTo("chart") },
    { id: "nav-alerts", label: "Go to Alerts", hint: "G A", section: "Navigation", run: () => navigateTo("alerts") },
    { id: "nav-heatmap", label: "Go to Heatmap", hint: "G M", section: "Navigation", run: () => navigateTo("heatmap") },
    { id: "nav-screener", label: "Go to Screener", hint: "G R", section: "Navigation", run: () => navigateTo("screener") },
    { id: "nav-settings", label: "Go to Settings", hint: "G S", section: "Navigation", run: () => navigateTo("settings") },
    { id: "nav-provider-health", label: "Go to Provider Health", hint: "G P", section: "Navigation", run: () => navigateTo("provider-health") },
    { id: "add-ticker", label: "Add Ticker", hint: "A", section: "Actions", run: () => addInput?.focus() },
    { id: "refresh-data", label: "Refresh Data", hint: "R", section: "Actions", run: () => void refreshData() },
    { id: "search-focus", label: "Focus Search", hint: "/", section: "Actions", run: () => addInput?.focus() },
  ];

  // Ctrl+K / Cmd+K → open palette
  shortcuts.register({ key: "k", ctrl: true, description: "Open command palette", handler: () => openPalette(paletteCommands) });

  // "/" → focus search (when palette not open)
  shortcuts.register({ key: "/", description: "Focus ticker search", handler: () => addInput?.focus() });

  // "r" → refresh data
  shortcuts.register({ key: "r", description: "Refresh data", handler: () => void refreshData() });

  // "?" → show shortcuts help
  shortcuts.register({
    key: "?",
    shift: true,
    description: "Show keyboard shortcuts",
    handler: () => {
      const list = shortcuts.list();
      const msg = list.map((s) => `${s.combo}: ${s.description}`).join("\n");
      showToast({ message: `Keyboard shortcuts:\n${msg}`, type: "info", durationMs: 8000 });
    },
  });

  // Escape → close palette if open
  shortcuts.register({ key: "Escape", description: "Close palette", handler: () => { if (isPaletteOpen()) { /* handled by palette input */ } } });

  void shortcuts; // retain reference

  // --- Storage Pressure Monitor ---
  const appCache = new TieredCache();
  const pressureMonitor = createStoragePressureMonitor({
    threshold: 0.8,
    intervalMs: 60_000,
    onPressure: (estimate) => {
      const evicted = appCache.evictOldest(10);
      if (evicted > 0) {
        console.warn(
          `[storage-pressure] ${(estimate.ratio * 100).toFixed(1)}% used — evicted ${evicted} cache entries`,
        );
      }
    },
  });
  pressureMonitor.start();
  void appCache; // retain reference
}

main();

// Register PWA service worker
void registerServiceWorker().then((reg) => {
  if (reg) {
    watchServiceWorkerUpdates(reg, {
      onUpdateReady: (handle) => {
        showToast({ message: "App update available — refreshing…", type: "info" });
        setTimeout(() => handle.applyUpdate(), 3_000);
      },
    });
  }
});
