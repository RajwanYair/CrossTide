/**
 * Settings card adapter — CardModule wrapper for the settings view.
 */
import { renderSettings } from "./settings";
import { loadConfig, saveConfig } from "../core/config";
import { initTheme } from "../ui/theme";
import {
  getStoredFinnhubKey,
  clearStoredFinnhubKey,
  FINNHUB_KEY_STORAGE,
} from "../core/finnhub-stream-manager";
import { hydrateCardSettings, updateCardSettingsSignal } from "../core/card-settings-signal";
import type { CardModule } from "./registry";

const settingsCard: CardModule = {
  mount(container, _ctx) {
    const config = loadConfig();
    hydrateCardSettings(config.cardSettings);
    const delegate = renderSettings(container, config, {
      onThemeChange(theme) {
        saveConfig({ ...loadConfig(), theme });
        initTheme(theme);
      },
      onExport() {
        /* wired by main */
      },
      onImport() {
        /* wired by main */
      },
      onClearWatchlist() {
        /* wired by main */
      },
      onClearCache() {
        /* wired by main */
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
          ...(latest.cardSettings ?? {}),
          [cardId]: settings,
        };
        saveConfig({ ...latest, cardSettings: nextCardSettings });
        updateCardSettingsSignal(cardId, settings);
      },
      onRefreshIntervalChange(ms) {
        const latest = loadConfig();
        saveConfig({ ...latest, refreshIntervalMs: ms });
      },
    });
    return { dispose: () => delegate.dispose() };
  },
};

export default settingsCard;
