/**
 * Settings card — renders settings panel and binds change handlers.
 */
import type { AppConfig } from "../types/domain";

export interface SettingsCallbacks {
  onThemeChange: (theme: AppConfig["theme"]) => void;
  onExport: () => void;
  onImport: () => void;
  onClearWatchlist: () => void;
  onClearCache: () => void;
}

export function renderSettings(
  container: HTMLElement,
  config: AppConfig,
  callbacks: SettingsCallbacks,
): void {
  container.innerHTML = `
    <div class="setting-group">
      <label for="theme-select">Theme</label>
      <select id="theme-select">
        <option value="dark"${config.theme === "dark" ? " selected" : ""}>Dark</option>
        <option value="light"${config.theme === "light" ? " selected" : ""}>Light</option>
        <option value="high-contrast"${config.theme === "high-contrast" ? " selected" : ""}>High Contrast</option>
      </select>
    </div>
    <div class="setting-group">
      <label>Watchlist</label>
      <span class="text-secondary">${config.watchlist.length} tickers</span>
    </div>
    <div class="setting-group">
      <label>Actions</label>
      <button id="btn-export" type="button">Export JSON</button>
      <button id="btn-import" type="button">Import JSON</button>
      <button id="btn-clear" type="button" class="btn-danger">Clear All</button>
    </div>
    <div class="setting-group">
      <label>Cache</label>
      <button id="btn-clear-cache" type="button">Clear Cache</button>
    </div>
    <div class="setting-group">
      <label>About</label>
      <span class="text-secondary">CrossTide — 12-method consensus engine</span>
    </div>`;

  const themeSelect = container.querySelector<HTMLSelectElement>("#theme-select");
  themeSelect?.addEventListener("change", () => {
    callbacks.onThemeChange(themeSelect.value as AppConfig["theme"]);
  });

  container.querySelector("#btn-export")?.addEventListener("click", () => callbacks.onExport());
  container.querySelector("#btn-import")?.addEventListener("click", () => callbacks.onImport());
  container
    .querySelector("#btn-clear")
    ?.addEventListener("click", () => callbacks.onClearWatchlist());
  container
    .querySelector("#btn-clear-cache")
    ?.addEventListener("click", () => callbacks.onClearCache());
}
