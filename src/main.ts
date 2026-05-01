/**
 * CrossTide Web — Main entry point.
 *
 * Bootstrap: load config, initialize UI, set up event listeners.
 */
import { loadConfig, saveConfig, addTicker, removeTicker } from "./core/config";
import { createCrossTabSync } from "./core/broadcast-channel";
import { registerServiceWorker } from "./core/sw-register";
import { watchServiceWorkerUpdates } from "./core/sw-update";
import { createShortcutManager } from "./core/keyboard";
import { initRouter, navigateTo, onRouteChange, type RouteName } from "./ui/router";
import { initTheme } from "./ui/theme";
import { renderWatchlist as renderWatchlistCore, setSortColumn, setSectorGrouping, isSectorGroupingEnabled, getSortConfig, type WatchlistQuote } from "./ui/watchlist";
import { loadCard, type CardHandle, type CardContext } from "./cards/registry";
import { showToast } from "./ui/toast";
import { openPalette, isPaletteOpen } from "./ui/palette-overlay";
import type { PaletteCommand } from "./ui/command-palette";
import { fetchAllTickers, fetchTickerData, type TickerData } from "./core/data-service";

import { TieredCache } from "./core/tiered-cache";
import { createStoragePressureMonitor, requestPersistentStorage } from "./core/storage-pressure";
import { setScreenerData } from "./cards/screener-data";
import { computeRsiSeries } from "./domain/rsi-calculator";
import { computeSma } from "./domain/sma-calculator";
import type { ScreenerInput } from "./cards/screener";
import { buildShareUrl, readShareUrl } from "./core/share-state";
import { mountInstrumentFilterBar, applyInstrumentFilter, getInstrumentFilter } from "./ui/instrument-filter";
import { bindSortableTable } from "./ui/sortable";
import { loadPersistedPalette, applyPalette, VALID_PALETTES, type ExtendedPaletteName } from "./ui/palette-switcher";
import { exportFullDataJson, exportFullDataCsv } from "./core/data-export";
import { downloadFile } from "./core/export-import";
import { createPwaInstallManager } from "./ui/pwa-install";
import { createOnboardingTour, DEFAULT_TOUR_STEPS } from "./ui/onboarding-tour";
import { initTelemetry, getTelemetry } from "./core/telemetry";

const cardHandles = new Map<RouteName, CardHandle>();
const cardContainers: Partial<Record<RouteName, string>> = {
  chart: "chart-container",
  alerts: "alerts-container",
  heatmap: "heatmap-container",
  screener: "screener-container",
  "provider-health": "provider-health-container",
  portfolio: "portfolio-container",
  risk: "risk-container",
  backtest: "backtest-container",
  "consensus-timeline": "consensus-timeline-container",
  "signal-dsl": "signal-dsl-container",
  "multi-chart": "multi-chart-container",
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

  // ── B11: Cross-tab BroadcastChannel sync ──────────────────────────────────
  const crossTabSync = createCrossTabSync();

  /** Save config locally + broadcast to other open tabs. */
  function saveAndBroadcast(cfg: typeof config): void {
    saveConfig(cfg);
    crossTabSync.broadcastConfig(cfg);
  }

  // When another tab changes config, apply it here and re-render watchlist
  crossTabSync.onConfigChange((raw) => {
    if (!raw || typeof raw !== "object") return;
    config = raw as typeof config;
    const filteredCfg = {
      ...config,
      watchlist: applyInstrumentFilter(config.watchlist, getInstrumentFilter()),
    };
    refreshWatchlist(filteredCfg, buildQuotesMap());
  });

  // ── Helper: convert TickerData cache → the quotes map renderWatchlist expects ──
  function buildQuotesMap(): Map<string, WatchlistQuote> {
    const m = new Map<string, WatchlistQuote>();
    for (const [t, data] of tickerDataCache) {
      m.set(t, {
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
        ...(data.instrumentType !== undefined && { instrumentType: data.instrumentType }),
        ...(data.sector !== undefined && { sector: data.sector }),
      });
    }
    return m;
  }

  /** Render watchlist + wire keyboard sort activation + aria-sort for accessibility (B14). */
  function refreshWatchlist(cfg: typeof config, quotes: Map<string, WatchlistQuote>): void {
    renderWatchlistCore(cfg, quotes);
    const thead = document.getElementById("watchlist-head");
    const liveRegion = document.getElementById("sort-live");
    const sortCol = (col: "ticker" | "price" | "change" | "consensus" | "volume"): void => {
      setSortColumn(col);
      const filteredCfg = {
        ...cfg,
        watchlist: applyInstrumentFilter(cfg.watchlist, getInstrumentFilter()),
      };
      refreshWatchlist(filteredCfg, buildQuotesMap());
    };
    const getAria = (col: string): string => {
      const s = getSortConfig();
      if (s.column !== col) return "none";
      return s.direction === "asc" ? "ascending" : "descending";
    };
    bindSortableTable(thead, sortCol, liveRegion, getAria);
  }

  function updateStatus(text: string): void {
    const el = document.getElementById("sync-status");
    if (el) el.textContent = text;
  }

  async function refreshData(): Promise<void> {
    const tickers = config.watchlist.map((e) => e.ticker);
    if (tickers.length === 0) {
      tickerDataCache.clear();
      refreshWatchlist(config, new Map());
      updateStatus("Ready");
      return;
    }

    updateStatus(`Fetching ${tickers.length} ticker(s)…`);

    const results = await fetchAllTickers(tickers, (done, total) => {
      updateStatus(`Loading ${done}/${total}…`);
    });

    tickerDataCache = results;

    // Apply instrument filter before rendering
    const filteredConfig = {
      ...config,
      watchlist: applyInstrumentFilter(config.watchlist, getInstrumentFilter()),
    };
    refreshWatchlist(filteredConfig, buildQuotesMap());

    // Update screener with live data derived from candles
    const screenerInputs: ScreenerInput[] = [];
    for (const [ticker, data] of results) {
      if (data.error || data.candles.length < 20) continue;
      const rsiSeries = computeRsiSeries(data.candles, 14);
      const lastRsi = rsiSeries.length > 0 ? rsiSeries[rsiSeries.length - 1]!.value : null;
      const volumeRatio = data.avgVolume > 0 ? data.volume / data.avgVolume : 0;
      const sma50 = computeSma(data.candles, 50);
      const sma200 = computeSma(data.candles, 200);
      const smaValues = new Map<number, number | null>([
        [50, sma50],
        [200, sma200],
      ]);
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
  loadPersistedPalette(); // C2: restore color-blind palette from localStorage
  initRouter();
  refreshWatchlist(config, new Map());

  // Mount instrument filter bar (B12)
  mountInstrumentFilterBar(() => {
    const filteredConfig = {
      ...config,
      watchlist: applyInstrumentFilter(config.watchlist, getInstrumentFilter()),
    };
    refreshWatchlist(filteredConfig, buildQuotesMap());
  });

  // ── URL share-state: restore on startup ───────────────────────────────
  const startupState = readShareUrl(window.location.href);
  let activeShareRoute: RouteName | undefined;
  if (startupState?.card && typeof startupState.card === "string") {
    // Navigate to shared card if it's a valid route
    const candidateRoute = startupState.card as RouteName;
    activeShareRoute = candidateRoute;
  }

  // Fetch live data on startup
  void refreshData().then(() => scheduleRefresh());

  // Navigate to shared route after router is up (startup share-state)
  if (activeShareRoute) {
    navigateTo(activeShareRoute);
  }

  let currentRoute: RouteName = "watchlist";

  onRouteChange((route, info) => {
    currentRoute = route;
    void activateCard(route, info?.params ?? {});
    // A17: track route navigation as a pageview
    getTelemetry()?.pageview(window.location.pathname);
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
      saveAndBroadcast(config);
      refreshWatchlist(config, new Map());
      addInput.value = "";
      showToast({ message: `Added ${ticker} — fetching data…`, type: "success" });
      maybeRequestPersist();
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
        saveAndBroadcast(config);
        refreshWatchlist(config, new Map());
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
    const sortedConfig = {
      ...config,
      watchlist: applyInstrumentFilter(config.watchlist, getInstrumentFilter()),
    };
    refreshWatchlist(sortedConfig, buildQuotesMap());
    const s = getSortConfig();
    const liveRegion = document.getElementById("sort-live");
    if (liveRegion) {
      liveRegion.textContent = `Sorted by ${col} ${s.direction === "asc" ? "ascending" : "descending"}`;
    }
  });

  // Theme change
  const themeSelect = document.getElementById("theme-select") as HTMLSelectElement | null;
  themeSelect?.addEventListener("change", () => {
    const theme = themeSelect.value as "dark" | "light";
    config = { ...config, theme };
    saveAndBroadcast(config);
  });

  // Color-blind palette change (C2)
  const paletteSelect = document.getElementById("palette-select") as HTMLSelectElement | null;
  if (paletteSelect) {
    // Sync select to currently loaded palette
    paletteSelect.value = document.documentElement.dataset["palette"] ?? "default";
    paletteSelect.addEventListener("change", () => {
      applyPalette(paletteSelect.value as ExtendedPaletteName);
    });
  }

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
          saveAndBroadcast(config);
          refreshWatchlist(config, new Map());
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
    saveAndBroadcast(config);
    refreshWatchlist(config, new Map());
    showToast({ message: "Watchlist cleared", type: "warning" });
  });

  // Clear cache
  document.getElementById("btn-clear-cache")?.addEventListener("click", () => {
    localStorage.removeItem("crosstide-cache");
    showToast({ message: "Cache cleared", type: "info" });
  });

  // Full-data export (C7)
  document.getElementById("btn-export-full-json")?.addEventListener("click", () => {
    const json = exportFullDataJson({ watchlist: config.watchlist });
    downloadFile(
      json,
      `crosstide-export-${new Date().toISOString().slice(0, 10)}.json`,
      "application/json",
    );
    showToast({ message: "Full data exported as JSON", type: "success" });
  });

  document.getElementById("btn-export-full-csv")?.addEventListener("click", () => {
    const csv = exportFullDataCsv({ watchlist: config.watchlist });
    downloadFile(csv, `crosstide-export-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv");
    showToast({ message: "Full data exported as CSV", type: "success" });
  });

  // --- Command Palette & Keyboard Shortcuts ---
  const shortcuts = createShortcutManager();
  const paletteCommands: PaletteCommand[] = [
    {
      id: "nav-watchlist",
      label: "Go to Watchlist",
      hint: "G W",
      section: "Navigation",
      run: () => navigateTo("watchlist"),
    },
    {
      id: "nav-consensus",
      label: "Go to Consensus",
      hint: "G C",
      section: "Navigation",
      run: () => navigateTo("consensus"),
    },
    {
      id: "nav-chart",
      label: "Go to Chart",
      hint: "G H",
      section: "Navigation",
      run: () => navigateTo("chart"),
    },
    {
      id: "nav-alerts",
      label: "Go to Alerts",
      hint: "G A",
      section: "Navigation",
      run: () => navigateTo("alerts"),
    },
    {
      id: "nav-heatmap",
      label: "Go to Heatmap",
      hint: "G M",
      section: "Navigation",
      run: () => navigateTo("heatmap"),
    },
    {
      id: "nav-screener",
      label: "Go to Screener",
      hint: "G R",
      section: "Navigation",
      run: () => navigateTo("screener"),
    },
    {
      id: "nav-settings",
      label: "Go to Settings",
      hint: "G S",
      section: "Navigation",
      run: () => navigateTo("settings"),
    },
    {
      id: "nav-provider-health",
      label: "Go to Provider Health",
      hint: "G P",
      section: "Navigation",
      run: () => navigateTo("provider-health"),
    },
    {
      id: "nav-portfolio",
      label: "Go to Portfolio",
      section: "Navigation",
      run: () => navigateTo("portfolio"),
    },
    {
      id: "nav-risk",
      label: "Go to Risk Metrics",
      section: "Navigation",
      run: () => navigateTo("risk"),
    },
    {
      id: "nav-backtest",
      label: "Go to Backtest",
      section: "Navigation",
      run: () => navigateTo("backtest"),
    },
    {
      id: "nav-consensus-timeline",
      label: "Go to Consensus Timeline",
      section: "Navigation",
      run: () => navigateTo("consensus-timeline"),
    },
    {
      id: "add-ticker",
      label: "Add Ticker",
      hint: "A",
      section: "Actions",
      run: () => addInput?.focus(),
    },
    {
      id: "refresh-data",
      label: "Refresh Data",
      hint: "R",
      section: "Actions",
      run: () => void refreshData(),
    },
    {
      id: "search-focus",
      label: "Focus Search",
      hint: "/",
      section: "Actions",
      run: () => addInput?.focus(),
    },
    {
      id: "copy-share-link",
      label: "Copy share link for current view",
      hint: "Shift+S",
      section: "Actions",
      run: () => {
        const shareUrl = buildShareUrl(window.location.pathname, { card: currentRoute });
        const fullUrl = window.location.origin + shareUrl;
        void navigator.clipboard
          .writeText(fullUrl)
          .then(() => {
            showToast({ message: "Share link copied to clipboard!", type: "success" });
          })
          .catch(() => {
            showToast({ message: `Share link: ${fullUrl}`, type: "info", durationMs: 0 });
          });
      },
    },
    {
      id: "check-storage",
      label: "Check storage usage",
      section: "Actions",
      run: () => {
        void pressureMonitor.check().then((e) => {
          if (!e) {
            showToast({ message: "Storage estimate unavailable in this browser.", type: "info" });
            return;
          }
          const pct = (e.ratio * 100).toFixed(1);
          const usedMb = (e.usage / 1024 / 1024).toFixed(1);
          const quotaMb = (e.quota / 1024 / 1024).toFixed(0);
          showToast({
            message: `Storage: ${pct}% used (${usedMb} MB / ${quotaMb} MB)`,
            type: e.ratio >= 0.8 ? "warning" : "info",
          });
        });
      },
    },
    {
      id: "clear-cache",
      label: "Clear app cache",
      section: "Actions",
      run: () => {
        appCache.clear();
        localStorage.removeItem("crosstide-cache");
        showToast({ message: "App cache cleared.", type: "info" });
      },
    },
    {
      id: "toggle-sector-grouping",
      label: "Toggle sector grouping in watchlist",
      section: "Actions",
      run: () => {
        const next = !isSectorGroupingEnabled();
        setSectorGrouping(next);
        const filteredConfig = {
          ...config,
          watchlist: applyInstrumentFilter(config.watchlist, getInstrumentFilter()),
        };
        refreshWatchlist(filteredConfig, buildQuotesMap());
        showToast({ message: `Sector grouping ${next ? "enabled" : "disabled"}`, type: "info" });
      },
    },
    // ── C2: Color-blind / high-contrast palette commands ──────────────────
    ...VALID_PALETTES.map((pal) => ({
      id: `set-palette-${pal}`,
      label: `Color palette: ${pal.charAt(0).toUpperCase() + pal.slice(1).replace("-", " ")}`,
      section: "Appearance",
      run: (): void => {
        applyPalette(pal);
        const select = document.getElementById("palette-select") as HTMLSelectElement | null;
        if (select) select.value = pal;
        showToast({ message: `Palette: ${pal}`, type: "info" });
      },
    })),
  ];

  // Ctrl+K / Cmd+K → open palette
  shortcuts.register({
    key: "k",
    ctrl: true,
    description: "Open command palette",
    handler: () => openPalette(paletteCommands),
  });

  // "/" → focus search (when palette not open)
  shortcuts.register({
    key: "/",
    description: "Focus ticker search",
    handler: () => addInput?.focus(),
  });

  // "r" → refresh data
  shortcuts.register({ key: "r", description: "Refresh data", handler: () => void refreshData() });

  // Shift+S → copy share link
  shortcuts.register({
    key: "s",
    shift: true,
    description: "Copy share link for current view",
    handler: () => {
      const shareUrl = buildShareUrl(window.location.pathname, { card: currentRoute });
      const fullUrl = window.location.origin + shareUrl;
      void navigator.clipboard
        .writeText(fullUrl)
        .then(() => {
          showToast({ message: "Share link copied to clipboard!", type: "success" });
        })
        .catch(() => {
          showToast({ message: `Share link: ${fullUrl}`, type: "info", durationMs: 0 });
        });
    },
  });

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
  shortcuts.register({
    key: "Escape",
    description: "Close palette",
    handler: () => {
      if (isPaletteOpen()) {
        /* handled by palette input */
      }
    },
  });

  void shortcuts; // retain reference

  // --- Storage Pressure Monitor ---
  const appCache = new TieredCache();
  let storagePersistRequested = false;
  const pressureMonitor = createStoragePressureMonitor({
    threshold: 0.8,
    intervalMs: 60_000,
    onPressure: (estimate) => {
      const pct = (estimate.ratio * 100).toFixed(0);
      const evicted = appCache.evictOldest(20);
      showToast({
        message: `Storage ${pct}% full — freed ${evicted} cache entr${evicted === 1 ? "y" : "ies"}. Consider clearing old data.`,
        type: "warning",
        durationMs: 8000,
      });
      console.warn(`[storage-pressure] ${pct}% used — evicted ${evicted} cache entries`);
    },
  });
  pressureMonitor.start();
  void appCache; // retain reference

  // ── C8: PWA install prompt ─────────────────────────────────────────────────
  const pwaInstall = createPwaInstallManager();
  const pwaGroup = document.getElementById("pwa-install-group");
  function showPwaInstallGroup(): void {
    if (pwaGroup) pwaGroup.style.display = "";
  }
  function hidePwaInstallGroup(): void {
    if (pwaGroup) pwaGroup.style.display = "none";
  }
  pwaInstall.onReady(showPwaInstallGroup);
  pwaInstall.onInstalled(() => {
    hidePwaInstallGroup();
    showToast({ message: "CrossTide installed as an app!", type: "success" });
  });
  document.getElementById("btn-install-pwa")?.addEventListener("click", () => {
    void pwaInstall.prompt().then((outcome) => {
      if (outcome === "accepted") hidePwaInstallGroup();
    });
  });
  document.getElementById("btn-dismiss-pwa")?.addEventListener("click", () => {
    pwaInstall.dismiss();
    hidePwaInstallGroup();
  });
  void pwaInstall; // retain reference

  // ── C9: Onboarding tour — show on first visit ──────────────────────────────
  const tour = createOnboardingTour(DEFAULT_TOUR_STEPS);
  // Delay slightly so DOM is settled and styles are applied
  setTimeout(() => tour.start(), 800);
  // "Reset tour" palette command for testers
  void tour; // retain reference

  // Request persistent storage on first ticker add (A21)
  function maybeRequestPersist(): void {
    if (storagePersistRequested) return;
    storagePersistRequested = true;
    void requestPersistentStorage().then((granted) => {
      if (!granted) {
        console.info("[storage] Persistent storage not granted (normal on first visit).");
      }
    });
  }
}

main();

// ── A17: Telemetry — analytics + error tracking + web vitals ──────────────
// Env-gated: no-op unless VITE_PLAUSIBLE_URL / VITE_GLITCHTIP_DSN are set.
const telemetry = initTelemetry();
telemetry.pageview(); // initial pageview

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
