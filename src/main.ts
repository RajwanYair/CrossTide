/**
 * CrossTide Web — Main entry point.
 *
 * Bootstrap: load config, initialize UI, set up event listeners.
 */
import { loadConfig, saveConfig, addTicker, removeTicker } from "./core/config";
import { initRouter, onRouteChange, type RouteName } from "./ui/router";
import { initTheme } from "./ui/theme";
import { renderWatchlist } from "./ui/watchlist";
import { loadCard, type CardHandle, type CardContext } from "./cards/registry";
import { showToast } from "./ui/toast";

const cardHandles = new Map<RouteName, CardHandle>();
const cardContainers: Partial<Record<RouteName, string>> = {
  chart: "chart-container",
  alerts: "alerts-container",
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

  // Initialize UI
  initTheme(config.theme);
  initRouter();
  renderWatchlist(config, new Map());

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
      showToast({ message: `Added ${ticker}`, type: "success" });
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
          const cleaned: { ticker: string; addedAt: number }[] = [];
          const now = Date.now();
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
          showToast({ message: `Imported ${added} new ticker(s)`, type: "success" });
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
}

main();
