/**
 * Settings card adapter — CardModule wrapper for the settings view.
 */
import { renderSettings } from "./settings";
import { loadConfig, saveConfig } from "../core/config";
import { initTheme } from "../ui/theme";
import { setThemeOverride } from "../ui/auto-theme-sync";
import { applyPalette } from "../ui/palette-switcher";
import {
  getStoredFinnhubKey,
  clearStoredFinnhubKey,
  FINNHUB_KEY_STORAGE,
} from "../core/finnhub-stream-manager";
import { hydrateCardSettings, updateCardSettingsSignal } from "../core/card-settings-signal";
import { initSettingsSearch } from "../ui/settings-search";
import { updateNotificationPrefs } from "../core/notification-prefs";
import { exportWatchlist } from "../core/watchlist-export";
import { parseTickersFromText } from "../core/watchlist-import";
import { captureElementAsSvg, downloadSvg } from "../core/export-image";
import { downloadFile, downloadCompressedFile } from "../core/export-import";
import { exportFullDataJson, exportFullDataCsv } from "../core/data-export";
import { collectFullBackup } from "../core/full-backup";
import { watchlistStore } from "../core/watchlist-store";
import { recordAdd } from "../core/watchlist-history";
import { showToast } from "../ui/toast";
import type { CardModule } from "./registry";

/** Fired after a config mutation that another part of the app (main.ts's
 * legacy watchlist rendering and refresh-interval timer) must resync. */
const CONFIG_CHANGED_EVENT = "crosstide:config-changed";

function notifyConfigChanged(): void {
  window.dispatchEvent(new CustomEvent(CONFIG_CHANGED_EVENT));
}

const settingsCard: CardModule = {
  mount(container, _ctx) {
    const config = loadConfig();
    hydrateCardSettings(config.cardSettings);
    const delegate = renderSettings(container, config, {
      onThemeChange(theme) {
        // Stops the OS-preference auto-sync from overwriting an explicit choice.
        setThemeOverride(theme);
        saveConfig({ ...loadConfig(), theme });
        initTheme(theme);
        notifyConfigChanged();
      },
      onPaletteChange(palette) {
        applyPalette(palette);
        showToast({ message: `Palette: ${palette}`, type: "info" });
      },
      onExport() {
        const latest = loadConfig();
        const content = exportWatchlist(
          latest.watchlist.map((entry) => ({ ticker: entry.ticker })),
          "json",
        );
        const blob = new Blob([content], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "crosstide-watchlist.json";
        a.click();
        URL.revokeObjectURL(url);
        showToast({ message: `Exported ${latest.watchlist.length} tickers`, type: "success" });
      },
      onExportImage() {
        const table = document.getElementById("watchlist-table");
        if (!table) return;
        downloadSvg(captureElementAsSvg(table), "crosstide-watchlist.svg");
        showToast({ message: "Watchlist image exported", type: "success" });
      },
      onExportGz() {
        const json = exportFullDataJson(collectFullBackup());
        void downloadCompressedFile(
          json,
          `crosstide-export-${new Date().toISOString().slice(0, 10)}.json.gz`,
          "application/json",
        ).then(() => showToast({ message: "Full data exported as .json.gz", type: "success" }));
      },
      onExportFullJson() {
        const json = exportFullDataJson(collectFullBackup());
        downloadFile(
          json,
          `crosstide-export-${new Date().toISOString().slice(0, 10)}.json`,
          "application/json",
        );
        showToast({ message: "Full data exported as JSON", type: "success" });
      },
      onExportFullCsv() {
        const csv = exportFullDataCsv(collectFullBackup());
        downloadFile(
          csv,
          `crosstide-export-${new Date().toISOString().slice(0, 10)}.csv`,
          "text/csv",
        );
        showToast({ message: "Full data exported as CSV", type: "success" });
      },
      onImport() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "application/json,.json";
        input.addEventListener("change", () => {
          const file = input.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.addEventListener("load", () => {
            try {
              const rawText = String(reader.result);
              let parsed: unknown[];
              try {
                const decoded: unknown = JSON.parse(rawText);
                if (!Array.isArray(decoded)) throw new Error("Expected an array");
                parsed = decoded;
              } catch {
                parsed = parseTickersFromText(rawText);
              }
              const cleaned: { ticker: string; addedAt: string }[] = [];
              const now = new Date().toISOString();
              for (const raw of parsed) {
                const ticker =
                  typeof raw === "string"
                    ? raw
                    : typeof raw === "object" && raw !== null && "ticker" in raw
                      ? typeof raw.ticker === "string"
                        ? raw.ticker
                        : null
                      : null;
                if (ticker && /^[A-Z][A-Z0-9.-]{0,9}$/.test(ticker.toUpperCase())) {
                  cleaned.push({ ticker: ticker.toUpperCase(), addedAt: now });
                }
              }
              if (cleaned.length === 0) {
                showToast({ message: "No valid tickers found", type: "warning" });
                return;
              }
              const latest = loadConfig();
              const seen = new Set(latest.watchlist.map((e) => e.ticker));
              const merged = [...latest.watchlist];
              let added = 0;
              for (const e of cleaned) {
                if (!seen.has(e.ticker)) {
                  merged.push(e);
                  watchlistStore.actions.addTicker(e.ticker);
                  recordAdd(e.ticker);
                  seen.add(e.ticker);
                  added++;
                }
              }
              saveConfig({ ...latest, watchlist: merged });
              notifyConfigChanged();
              showToast({
                message: `Imported ${added} new ticker(s) — fetching data…`,
                type: "success",
              });
            } catch (err) {
              showToast({ message: `Import failed: ${(err as Error).message}`, type: "error" });
            }
          });
          reader.readAsText(file);
        });
        input.click();
      },
      onClearWatchlist() {
        const latest = loadConfig();
        if (latest.watchlist.length === 0) return;
        saveConfig({ ...latest, watchlist: [] });
        notifyConfigChanged();
        showToast({ message: "Watchlist cleared", type: "warning" });
      },
      onClearCache() {
        localStorage.removeItem("crosstide-cache");
        showToast({ message: "Cache cleared", type: "info" });
      },
      onFinnhubKeyChange(apiKey) {
        if (apiKey) {
          try {
            localStorage.setItem(FINNHUB_KEY_STORAGE, apiKey);
          } catch {
            // ignore
          }
        } else {
          clearStoredFinnhubKey();
        }
        void getStoredFinnhubKey(); // side-effect-free read to verify
      },
      onMethodWeightsChange(weights) {
        const latest = loadConfig();
        saveConfig({ ...latest, methodWeights: weights });
      },
      onCardSettingsChange(cardId, settings) {
        const latest = loadConfig();
        const nextCardSettings = {
          ...latest.cardSettings,
          [cardId]: settings,
        };
        saveConfig({ ...latest, cardSettings: nextCardSettings });
        updateCardSettingsSignal(cardId, settings);
      },
      onRefreshIntervalChange(ms) {
        const latest = loadConfig();
        saveConfig({ ...latest, refreshIntervalMs: ms });
        notifyConfigChanged();
      },
      onNotificationPrefsChange(updates) {
        updateNotificationPrefs(updates);
      },
    });
    const cleanupSearch = initSettingsSearch(container);
    return {
      dispose: (): void => {
        delegate.dispose();
        cleanupSearch();
      },
    };
  },
};

export default settingsCard;
