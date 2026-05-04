/**
 * CrossTide Web — Main entry point.
 *
 * Bootstrap: load config, initialize UI, set up event listeners.
 */
// G16: self-hosted Inter variable font (replaces system fallback)
import "@fontsource-variable/inter";
import {
  loadConfig,
  saveConfig,
  addTicker,
  removeTicker,
  reorderWatchlist,
  updateWatchlistNames,
  updateWatchlistInstrumentTypes,
} from "./core/config";
import { createCrossTabSync } from "./core/broadcast-channel";
import { registerServiceWorker } from "./core/sw-register";
import { watchServiceWorkerUpdates } from "./core/sw-update";
import { createShortcutManager } from "./core/keyboard";
import { initRouter, navigateTo, navigateToPath, onRouteChange, type RouteName } from "./ui/router";
import { initTheme } from "./ui/theme";
import { initLocale } from "./core/i18n";
import {
  renderWatchlist as renderWatchlistCore,
  setSortColumn,
  setSectorGrouping,
  isSectorGroupingEnabled,
  getSortConfig,
  type WatchlistQuote,
} from "./ui/watchlist";
import { loadCard, type CardHandle, type CardContext } from "./cards/registry";
import { mountWithBoundary } from "./ui/error-boundary";
import { showToast } from "./ui/toast";
import { openPalette, isPaletteOpen } from "./ui/palette-overlay";
import type { PaletteCommand } from "./ui/command-palette";
import { fetchAllTickers, fetchTickerData, type TickerData } from "./core/data-service";
import { selectedTickerStore } from "./core/app-store";

import { TieredCache } from "./core/tiered-cache";
import { createStoragePressureMonitor, requestPersistentStorage } from "./core/storage-pressure";
import { setScreenerData } from "./cards/screener-data";
import { setBreadthData } from "./cards/market-breadth-data";
import { computeRsiSeries } from "./domain/rsi-calculator";
import { computeSma } from "./domain/sma-calculator";
import type { InstrumentType, ConsensusResult } from "./types/domain";
import type { ScreenerInput } from "./cards/screener";
import { buildShareUrl, readShareUrl, encodeWatchlistUrl } from "./core/share-state";
import {
  mountInstrumentFilterBar,
  applyInstrumentFilter,
  getInstrumentFilter,
} from "./ui/instrument-filter";
import { bindSortableTable } from "./ui/sortable";
import {
  loadPersistedPalette,
  applyPalette,
  VALID_PALETTES,
  type ExtendedPaletteName,
} from "./ui/palette-switcher";
import { exportFullDataJson, exportFullDataCsv } from "./core/data-export";
import { downloadFile, downloadCompressedFile } from "./core/export-import";
import { createPwaInstallManager } from "./ui/pwa-install";
import { createOnboardingTour, DEFAULT_TOUR_STEPS } from "./ui/onboarding-tour";
import { initOfflineIndicator } from "./ui/offline-indicator";
import { initCardCollapse } from "./ui/card-collapse";
import { initDashboardStats } from "./ui/dashboard-stats";
import { initTelemetry, getTelemetry } from "./core/telemetry";
import { createStreamManager, getStoredFinnhubKey } from "./core/finnhub-stream-manager";
import { createAutocomplete } from "./ui/ticker-autocomplete";
import { bindHoverZoom, setHoverQuotes } from "./ui/watchlist-hover-zoom";
import { evaluateAlertRules } from "./core/alert-rules-evaluator";
import { checkWhatsNew } from "./core/whats-new";
import { openShortcutsDialog } from "./ui/shortcuts-dialog";
import { updateFreshnessIndicator } from "./ui/freshness-indicator";

const cardHandles = new Map<RouteName, CardHandle>();
const prefetchedCards = new Set<RouteName>();
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
  correlation: "correlation-container",
  "market-breadth": "market-breadth-container",
  "earnings-calendar": "earnings-calendar-container",
  "macro-dashboard": "macro-dashboard-container",
  "sector-rotation": "sector-rotation-container",
  "relative-strength": "relative-strength-container",
};

function initCardPrefetchOnIntent(): void {
  const links = document.querySelectorAll<HTMLAnchorElement>("#app-nav .nav-link[data-route]");
  links.forEach((link) => {
    const route = link.dataset["route"] as RouteName | undefined;
    if (!route) return;
    const prefetch = (): void => {
      if (prefetchedCards.has(route)) return;
      prefetchedCards.add(route);
      void loadCard(route).catch(() => {
        // Keep intent prefetch best-effort; navigation path handles real errors.
      });
    };
    link.addEventListener("mouseenter", prefetch, { passive: true });
    link.addEventListener("focus", prefetch, { passive: true });
  });
}

async function activateCard(
  route: RouteName,
  params: Readonly<Record<string, string>>,
): Promise<void> {
  const containerId = cardContainers[route];
  if (!containerId) return;
  const el = document.getElementById(containerId);
  if (!el) return;

  // K6: Ensure card containers are ARIA live regions so screen readers
  // announce content updates (data refreshes, loading states).
  if (!el.hasAttribute("aria-live")) {
    el.setAttribute("aria-live", "polite");
    el.setAttribute("aria-atomic", "false");
  }

  // Inject selected ticker as symbol fallback when not already in route params
  const enrichedParams: Record<string, string> = { ...params };
  if (!enrichedParams["symbol"]) {
    const selected = selectedTickerStore.peek();
    if (selected) enrichedParams["symbol"] = selected;
  }

  const ctx: CardContext = { route, params: enrichedParams };
  const existing = cardHandles.get(route);
  if (existing) {
    existing.update?.(ctx);
    return;
  }
  const handle = await mountWithBoundary(el, ctx, () => loadCard(route), {
    onError: (err) => console.error("Card error:", route, err),
  });
  cardHandles.set(route, handle);
}

function main(): void {
  let config = loadConfig();
  let tickerDataCache = new Map<string, TickerData>();
  let refreshTimer: ReturnType<typeof setTimeout> | null = null;

  // H3: eager-prefetch card chunks on hover/focus intent.
  initCardPrefetchOnIntent();

  // ── B11: Cross-tab BroadcastChannel sync ──────────────────────────────────
  const crossTabSync = createCrossTabSync();

  /** Save config locally + broadcast to other open tabs + resync stream subscriptions. */
  function saveAndBroadcast(cfg: typeof config): void {
    saveConfig(cfg);
    crossTabSync.broadcastConfig(cfg);
    if (streamManager.isActive()) {
      streamManager.setTickers(cfg.watchlist.map((e) => e.ticker));
    }
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
    // Build a lookup of persisted names from config so they appear before first fetch.
    const persistedNames = new Map<string, string>(
      config.watchlist.filter((e) => e.name).map((e) => [e.ticker, e.name!]),
    );
    for (const [t, data] of tickerDataCache) {
      const resolvedName = data.name ?? persistedNames.get(t);
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
        ...(resolvedName !== undefined && { name: resolvedName }),
      });
    }
    return m;
  }

  /** Render watchlist + wire keyboard sort activation + aria-sort for accessibility (B14). */
  function refreshWatchlist(cfg: typeof config, quotes: Map<string, WatchlistQuote>): void {
    renderWatchlistCore(cfg, quotes);
    setHoverQuotes(quotes); // L11: keep hover-zoom popup up-to-date
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

    const results = await fetchAllTickers(
      tickers,
      (done, total) => {
        updateStatus(`Loading ${done}/${total}…`);
      },
      undefined,
      config.methodWeights,
    );

    tickerDataCache = results;

    // G19: Persist company names returned by the data service into WatchlistEntry.
    // Build a map of ticker → name from successful fetches only.
    const nameMap = new Map<string, string>();
    for (const [t, data] of results) {
      if (data.name && !data.error) nameMap.set(t, data.name);
    }
    if (nameMap.size > 0) {
      const updated = updateWatchlistNames(config, nameMap);
      if (updated !== config) {
        config = updated;
        saveAndBroadcast(config);
      }
    }

    // Persist instrument type classifications so filters work after reload.
    const typeMap = new Map<string, InstrumentType>();
    for (const [t, data] of results) {
      if (data.instrumentType && !data.error) typeMap.set(t, data.instrumentType);
    }
    if (typeMap.size > 0) {
      const updated = updateWatchlistInstrumentTypes(config, typeMap);
      if (updated !== config) {
        config = updated;
        saveAndBroadcast(config);
      }
    }

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
        pe: null,
        marketCap: null,
        dividendYield: null,
        sector: data.sector ?? null,
      });
    }
    setScreenerData(screenerInputs);

    // G23: populate market-breadth bridge (uses already-computed sma50/200)
    const breadthInputs = screenerInputs.map((si) => ({
      ticker: si.ticker,
      price: si.price,
      changePercent: results.get(si.ticker)?.changePercent ?? 0,
      consensus: si.consensus,
      aboveSma50:
        si.smaValues.get(50) !== null && si.smaValues.get(50) !== undefined
          ? (results.get(si.ticker)?.price ?? 0) > si.smaValues.get(50)!
          : null,
      aboveSma200:
        si.smaValues.get(200) !== null && si.smaValues.get(200) !== undefined
          ? (results.get(si.ticker)?.price ?? 0) > si.smaValues.get(200)!
          : null,
    }));
    setBreadthData(breadthInputs);

    // L3: Evaluate multi-condition alert rules against latest signals
    const consensusMap = new Map<string, ConsensusResult>();
    for (const [t, data] of results) {
      if (data.consensus && !data.error) consensusMap.set(t, data.consensus);
    }
    evaluateAlertRules(consensusMap);

    const errors = [...results.values()].filter((d) => d.error);
    if (errors.length > 0 && errors.length < tickers.length) {
      updateStatus(`Updated (${errors.length} failed)`);
    } else if (errors.length === tickers.length) {
      updateStatus("All fetches failed — check network");
      showToast({
        message:
          "Could not fetch market data. If you are behind a corporate firewall, ensure your browser proxy is configured (the app fetches Yahoo Finance directly from the browser). Check the browser console (F12) for details.",
        type: "error",
        durationMs: 12000,
      });
    } else {
      updateStatus(`Updated ${new Date().toLocaleTimeString()}`);
    }

    updateFreshnessIndicator();
  }

  function scheduleRefresh(): void {
    if (refreshTimer) clearTimeout(refreshTimer);
    const interval = config.refreshIntervalMs ?? 300_000; // default 5 min
    refreshTimer = setTimeout(() => void refreshData(), interval);
  }

  // Initialize UI
  initLocale(); // D7: apply persisted locale & <html dir>
  initTheme(config.theme);
  loadPersistedPalette(); // C2: restore color-blind palette from localStorage
  initRouter();
  initOfflineIndicator();
  initCardCollapse();
  initDashboardStats();
  checkWhatsNew();
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
  // D5: restore shared watchlist from URL (only when local watchlist is empty)
  if (
    Array.isArray(startupState?.watchlist) &&
    startupState.watchlist.length > 0 &&
    config.watchlist.length === 0
  ) {
    for (const ticker of startupState.watchlist) {
      if (typeof ticker === "string" && ticker) config = addTicker(config, ticker);
    }
    saveAndBroadcast(config);
    refreshWatchlist(config, new Map());
    showToast({
      message: `Loaded ${config.watchlist.length} tickers from shared link`,
      type: "success",
    });
  }

  // Fetch live data on startup — moved to bottom of main() so streaming starts after data loads

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

  // Market hours indicator
  const footer = document.getElementById("app-footer");
  if (footer) {
    const marketEl = document.createElement("span");
    marketEl.id = "market-status-indicator";
    footer.appendChild(marketEl);
    void import("./ui/market-indicator").then(({ mountMarketIndicator }) => {
      mountMarketIndicator(marketEl);
    });
  }

  // Add ticker via autocomplete widget (enhanced search-as-you-type)
  const addInput = document.getElementById("add-ticker") as HTMLInputElement | null;
  let autocompleteHandle: ReturnType<typeof createAutocomplete> | null = null;

  function handleAddTicker(ticker: string): void {
    const t = ticker.trim().toUpperCase();
    if (!t) return;
    if (!/^[A-Z][A-Z0-9.-]{0,9}$/.test(t)) {
      showToast({ message: `Invalid ticker: ${t}`, type: "error" });
      return;
    }
    if (config.watchlist.some((e) => e.ticker === t)) {
      showToast({ message: `${t} already in watchlist`, type: "warning" });
      return;
    }
    config = addTicker(config, t);
    saveAndBroadcast(config);
    refreshWatchlist(config, new Map());
    showToast({ message: `Added ${t} — fetching data…`, type: "success" });
    maybeRequestPersist();
    void fetchTickerData(t).then((data) => {
      tickerDataCache.set(t, data);
      void refreshData();
    });
  }

  if (addInput) {
    void import("./providers/provider-registry").then(({ getChain }) => {
      autocompleteHandle = createAutocomplete({
        onSearch: (query) => getChain().search(query),
        onSelect: handleAddTicker,
        placeholder: "Search ticker (e.g. AAPL)…",
      });
      addInput.replaceWith(autocompleteHandle.element);
    });
  }

  // D5: Share watchlist button — encode tickers into a deep-link URL
  const shareWlBtn = document.getElementById("btn-share-watchlist") as HTMLButtonElement | null;
  shareWlBtn?.addEventListener("click", () => {
    const tickers = config.watchlist.map((e) => e.ticker);
    const url = encodeWatchlistUrl(tickers, window.location.href);
    void navigator.clipboard
      .writeText(url)
      .then(() => {
        showToast({ message: "Watchlist link copied to clipboard!", type: "success" });
      })
      .catch(() => {
        showToast({ message: `Watchlist link: ${url}`, type: "info", durationMs: 0 });
      });
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
      return;
    }
    // Clicking a row (not the remove button) selects ticker and opens chart
    const row = target.closest<HTMLElement>("tr[data-ticker]");
    if (row) {
      const ticker = row.dataset["ticker"];
      if (ticker) {
        selectedTickerStore.set(ticker);
        navigateToPath("chart", { symbol: ticker });
      }
    }
  });

  // ── L11: Hover zoom on watchlist rows ──────────────────────────────────────
  if (tbody) {
    bindHoverZoom(tbody);
  }

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

  // ── A11: Drag-reorder watchlist rows ──────────────────────────────────────
  if (tbody) {
    let dragFromIndex: number | null = null;

    tbody.addEventListener("dragstart", (e) => {
      const row = (e.target as HTMLElement).closest<HTMLElement>("tr[data-ticker]");
      if (!row) return;
      dragFromIndex = [...tbody.children].indexOf(row);
      row.classList.add("dragging");
      e.dataTransfer?.setData("text/plain", row.dataset["ticker"] ?? "");
    });

    tbody.addEventListener("dragover", (e) => {
      e.preventDefault();
      const row = (e.target as HTMLElement).closest<HTMLElement>("tr[data-ticker]");
      if (row) row.classList.add("drag-over");
    });

    tbody.addEventListener("dragleave", (e) => {
      const row = (e.target as HTMLElement).closest<HTMLElement>("tr[data-ticker]");
      if (row) row.classList.remove("drag-over");
    });

    tbody.addEventListener("drop", (e) => {
      e.preventDefault();
      const row = (e.target as HTMLElement).closest<HTMLElement>("tr[data-ticker]");
      if (!row || dragFromIndex === null) return;
      row.classList.remove("drag-over");
      const toIndex = [...tbody.children].indexOf(row);
      if (toIndex !== dragFromIndex) {
        config = reorderWatchlist(config, dragFromIndex, toIndex);
        saveAndBroadcast(config);
        refreshWatchlist(config, buildQuotesMap());
      }
      dragFromIndex = null;
    });

    tbody.addEventListener("dragend", () => {
      dragFromIndex = null;
      tbody.querySelectorAll(".dragging").forEach((el) => el.classList.remove("dragging"));
    });
  }

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

  // Compressed export (G11) — .json.gz via Compression Streams API
  document.getElementById("btn-export-gz")?.addEventListener("click", () => {
    const json = exportFullDataJson({ watchlist: config.watchlist });
    void downloadCompressedFile(
      json,
      `crosstide-export-${new Date().toISOString().slice(0, 10)}.json.gz`,
      "application/json",
    ).then(() => showToast({ message: "Full data exported as .json.gz", type: "success" }));
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
      run: () => autocompleteHandle?.focus(),
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
      run: () => autocompleteHandle?.focus(),
    },
    {
      id: "copy-share-link",
      label: "Copy share link for current view",
      hint: "Shift+S",
      section: "Actions",
      run: (): void => {
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
      id: "share-watchlist",
      label: "Share watchlist URL",
      section: "Actions",
      run: () => shareWlBtn?.click(),
    },
    {
      id: "check-storage",
      label: "Check storage usage",
      section: "Actions",
      run: (): void => {
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
      run: (): void => {
        appCache.clear();
        localStorage.removeItem("crosstide-cache");
        showToast({ message: "App cache cleared.", type: "info" });
      },
    },
    {
      id: "toggle-sector-grouping",
      label: "Toggle sector grouping in watchlist",
      section: "Actions",
      run: (): void => {
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
    handler: () => autocompleteHandle?.focus(),
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
      openShortcutsDialog();
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
    pwaGroup?.classList.remove("hidden");
  }
  function hidePwaInstallGroup(): void {
    pwaGroup?.classList.add("hidden");
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
        // Storage not granted on first visit — this is normal
        void granted;
      }
    });
  }

  // ── B1: Finnhub WebSocket streaming ────────────────────────────────────────
  const streamManager = createStreamManager();

  /** Apply a live-price tick to the watchlist row without a full re-render. */
  streamManager.onLiveTick(({ ticker, price }) => {
    const priceCell = document.querySelector<HTMLElement>(
      `#watchlist-body tr[data-ticker="${CSS.escape(ticker)}"] .price-cell`,
    );
    if (priceCell) {
      priceCell.textContent = price.toFixed(2);
      priceCell.classList.add("live-flash");
      setTimeout(() => priceCell.classList.remove("live-flash"), 800);
    }
    // Also keep tickerDataCache in sync so next poll re-render shows live value
    const cached = tickerDataCache.get(ticker);
    if (cached) {
      tickerDataCache.set(ticker, { ...cached, price });
    }
  });

  streamManager.onStatusChange((status) => {
    const statusEl = document.getElementById("sync-status");
    if (!statusEl) return;
    if (status === "connected") {
      statusEl.textContent = "● LIVE";
      statusEl.classList.add("status-live");
    } else if (status === "connecting") {
      statusEl.textContent = "Connecting…";
      statusEl.classList.remove("status-live");
    } else if (status === "disconnected" || status === "error") {
      statusEl.textContent = "Stream disconnected";
      statusEl.classList.remove("status-live");
    } else {
      statusEl.classList.remove("status-live");
    }
  });

  /** Start or restart the stream with the current ticker list. */
  function startStreamIfKeySet(): void {
    const apiKey = getStoredFinnhubKey();
    if (!apiKey) return;
    const tickers = config.watchlist.map((e) => e.ticker);
    streamManager.start(apiKey, tickers);
  }

  // Command-palette entry for stream control
  paletteCommands.push({
    id: "toggle-live-stream",
    label: streamManager.isActive() ? "Stop real-time streaming" : "Start real-time streaming",
    section: "Actions",
    run: (): void => {
      if (streamManager.isActive()) {
        streamManager.stop();
        showToast({ message: "Real-time streaming stopped", type: "info" });
      } else {
        const key = getStoredFinnhubKey();
        if (!key) {
          showToast({
            message: "Add a Finnhub API key in Settings to enable live streaming",
            type: "warning",
          });
          navigateTo("settings");
        } else {
          startStreamIfKeySet();
          showToast({ message: "Starting live stream…", type: "info" });
        }
      }
    },
  });

  // Start streaming after initial data load if key is stored
  void refreshData().then(() => {
    scheduleRefresh();
    startStreamIfKeySet();
  });
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
        const banner = document.createElement("div");
        banner.className = "sw-update-banner";
        banner.setAttribute("role", "alert");
        banner.setAttribute("aria-live", "assertive");

        const msg = document.createElement("span");
        msg.textContent = "A new version is available.";
        banner.appendChild(msg);

        const btn = document.createElement("button");
        btn.textContent = "Refresh";
        btn.className = "sw-update-btn";
        btn.addEventListener("click", () => {
          handle.applyUpdate();
          window.location.reload();
        });
        banner.appendChild(btn);

        const dismiss = document.createElement("button");
        dismiss.textContent = "Later";
        dismiss.className = "sw-update-dismiss";
        dismiss.setAttribute("aria-label", "Dismiss update");
        dismiss.addEventListener("click", () => banner.remove());
        banner.appendChild(dismiss);

        document.body.appendChild(banner);
      },
    });
  }
});
