/**
 * Settings card — renders settings panel and binds change handlers.
 */
import type { AppConfig, CardId, CardSettingsMap, MethodWeights } from "../types/domain";
import { DEFAULT_METHOD_WEIGHTS } from "../types/domain";
import { FINNHUB_KEY_STORAGE } from "../core/finnhub-stream-manager";
import { patchDOM } from "../core/patch-dom";
import { createDelegate, type DelegateHandle } from "../ui/delegate";

const METHOD_NAMES = [
  "Micho",
  "RSI",
  "MACD",
  "Bollinger",
  "Stochastic",
  "OBV",
  "ADX",
  "CCI",
  "SAR",
  "WilliamsR",
  "MFI",
  "SuperTrend",
] as const;

export interface SettingsCallbacks {
  onThemeChange: (theme: AppConfig["theme"]) => void;
  onExport: () => void;
  /** Called when user requests a gzip-compressed export (G11). */
  onExportGz?: () => void;
  onImport: () => void;
  onClearWatchlist: () => void;
  onClearCache: () => void;
  /** Called when user saves or clears the Finnhub API key. */
  onFinnhubKeyChange?: (apiKey: string | null) => void;
  /** Called when user changes per-method consensus weights (G20). */
  onMethodWeightsChange?: (weights: MethodWeights) => void;
  /** Called when user changes selected card settings (G24). */
  onCardSettingsChange?: <K extends CardId>(
    cardId: K,
    settings: NonNullable<CardSettingsMap[K]>,
  ) => void;
}

const CARD_SETTINGS_OPTIONS: ReadonlyArray<{ id: CardId; label: string }> = [
  { id: "watchlist", label: "Watchlist" },
  { id: "chart", label: "Chart" },
  { id: "consensus", label: "Consensus" },
  { id: "screener", label: "Screener" },
  { id: "heatmap", label: "Heatmap" },
  { id: "backtest", label: "Backtest" },
  { id: "alerts", label: "Alerts" },
  { id: "portfolio", label: "Portfolio" },
  { id: "risk", label: "Risk" },
];

export function renderSettings(
  container: HTMLElement,
  config: AppConfig,
  callbacks: SettingsCallbacks,
): DelegateHandle {
  const storedKey = ((): string => {
    try {
      return localStorage.getItem(FINNHUB_KEY_STORAGE) ?? "";
    } catch {
      return "";
    }
  })();

  patchDOM(
    container,
    `
    <div class="setting-group">
      <label for="theme-select">Theme</label>
      <select id="theme-select" data-action="theme-change">
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
      <button data-action="export" type="button">Export JSON</button>
      <button data-action="export-gz" type="button">Export .json.gz</button>
      <button data-action="import" type="button">Import JSON</button>
      <button data-action="clear-watchlist" type="button" class="btn-danger">Clear All</button>
    </div>
    <div class="setting-group">
      <label>Cache</label>
      <button data-action="clear-cache" type="button">Clear Cache</button>
    </div>
    <div class="setting-group">
      <label>About</label>
      <span class="text-secondary">CrossTide — 12-method consensus engine</span>
    </div>
    ${renderWeightsSection(config.methodWeights)}
    <div class="setting-group">
      <label for="card-settings-picker">Card Settings</label>
      <select id="card-settings-picker" data-action="card-picker-change">
        ${CARD_SETTINGS_OPTIONS.map((o) => `<option value="${o.id}">${o.label}</option>`).join("")}
      </select>
      <div id="card-settings-panel"></div>
    </div>
    <div class="setting-group">
      <label for="finnhub-key-input">
        Finnhub API Key
        <span class="text-secondary" style="font-weight:normal;font-size:0.85em">
          (optional — enables real-time streaming)
        </span>
      </label>
      <input
        id="finnhub-key-input"
        type="password"
        autocomplete="off"
        placeholder="Paste your Finnhub API key…"
        style="flex:1;min-width:0"
        value="${escapeAttr(storedKey)}"
        aria-describedby="finnhub-key-hint"
      />
      <button data-action="finnhub-save" type="button">Save Key</button>
      <button data-action="finnhub-clear" type="button" class="btn-danger"${!storedKey ? " disabled" : ""}>Clear</button>
      <p id="finnhub-key-hint" class="text-secondary" style="font-size:0.8em;margin:0">
        Key is stored only in your browser's localStorage. Get a free key at
        <a href="https://finnhub.io" rel="noopener noreferrer" target="_blank">finnhub.io</a>.
      </p>
    </div>`,
  );

  const themeSelect = container.querySelector<HTMLSelectElement>("#theme-select");

  // Delegated button actions
  const keyInput = container.querySelector<HTMLInputElement>("#finnhub-key-input");
  const clearBtn = container.querySelector<HTMLButtonElement>("[data-action='finnhub-clear']");

  const delegate = createDelegate(
    container,
    {
      export: () => callbacks.onExport(),
      "export-gz": () => callbacks.onExportGz?.(),
      import: () => callbacks.onImport(),
      "clear-watchlist": () => callbacks.onClearWatchlist(),
      "clear-cache": () => callbacks.onClearCache(),
      "reset-weights": () => {
        for (const method of METHOD_NAMES) {
          const slider = container.querySelector<HTMLInputElement>(`#weight-${method}`);
          const label = container.querySelector<HTMLOutputElement>(`#weight-${method}-out`);
          const def = DEFAULT_METHOD_WEIGHTS[method] ?? 1;
          if (slider) slider.value = String(def);
          if (label) label.textContent = def.toFixed(1);
        }
        callbacks.onMethodWeightsChange?.({ ...DEFAULT_METHOD_WEIGHTS });
      },
      "finnhub-save": () => {
        const key = keyInput?.value.trim() ?? "";
        if (!key) return;
        callbacks.onFinnhubKeyChange?.(key);
        if (clearBtn) clearBtn.disabled = false;
      },
      "finnhub-clear": () => {
        if (keyInput) keyInput.value = "";
        if (clearBtn) clearBtn.disabled = true;
        callbacks.onFinnhubKeyChange?.(null);
      },
      "theme-change": () => {
        if (themeSelect) {
          callbacks.onThemeChange(themeSelect.value as AppConfig["theme"]);
        }
      },
      "card-picker-change": () => {
        const next = picker?.value as CardId;
        if (!CARD_SETTINGS_OPTIONS.some((o) => o.id === next)) return;
        selectedCard = next;
        rerenderCardSettingsPanel();
      },
    },
    { eventTypes: ["click", "change"] },
  );

  // G20: consensus weight sliders — delegated via input event
  function readWeights(): MethodWeights {
    const w: MethodWeights = {};
    for (const method of METHOD_NAMES) {
      const slider = container.querySelector<HTMLInputElement>(`#weight-${method}`);
      if (slider) {
        const v = parseFloat(slider.value);
        if (!isNaN(v)) w[method] = Math.min(3, Math.max(0, v));
      }
    }
    return w;
  }

  const inputDelegate = createDelegate(
    container,
    {
      "weight-slide": (_target, e) => {
        const slider = e.target as HTMLInputElement;
        const method = slider.dataset["method"] ?? "";
        const label = container.querySelector<HTMLOutputElement>(`#weight-${method}-out`);
        if (label) label.textContent = parseFloat(slider.value).toFixed(1);
        callbacks.onMethodWeightsChange?.(readWeights());
      },
      "card-setting-change": () => {
        emitCardSettings();
      },
    },
    { eventTypes: ["input", "change"] },
  );

  // G24: Per-card settings picker + dynamic section
  const picker = container.querySelector<HTMLSelectElement>("#card-settings-picker");
  const panel = container.querySelector<HTMLElement>("#card-settings-panel");
  let selectedCard: CardId = "watchlist";

  function emitCardSettings(): void {
    const parsed = readCardSettingsFromPanel(selectedCard, container);
    if (parsed) {
      callbacks.onCardSettingsChange?.(selectedCard, parsed as never);
    }
  }

  function rerenderCardSettingsPanel(): void {
    if (!panel) return;
    patchDOM(panel, renderCardSettingsPanel(selectedCard, config.cardSettings));
    // Mark all card-settings inputs/selects for delegation
    panel.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input,select").forEach((el) => {
      el.dataset["action"] = "card-setting-change";
    });
  }

  rerenderCardSettingsPanel();

  return {
    dispose(): void {
      delegate.dispose();
      inputDelegate.dispose();
    },
  };
}

function renderWeightsSection(methodWeights?: MethodWeights): string {
  const rows = METHOD_NAMES.map((method) => {
    const defaultVal = DEFAULT_METHOD_WEIGHTS[method] ?? 1;
    const currentVal = methodWeights?.[method] ?? defaultVal;
    return `<div class="weight-row">
      <label for="weight-${method}" class="weight-label">${method}</label>
      <input
        id="weight-${method}"
        type="range"
        min="0" max="3" step="0.1"
        value="${currentVal.toFixed(1)}"
        class="weight-slider"
        aria-label="${method} weight"
        data-action="weight-slide"
        data-method="${method}"
      />
      <output id="weight-${method}-out" class="weight-value">${currentVal.toFixed(1)}</output>
    </div>`;
  }).join("");

  return `<div class="setting-group">
    <label>Consensus Weights
      <span class="text-secondary" style="font-weight:normal;font-size:0.85em">
        (0 = disabled, 1 = normal, 3 = triple)
      </span>
    </label>
    <div class="weight-grid">${rows}</div>
    <button data-action="reset-weights" type="button">Reset to defaults</button>
  </div>`;
}

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderCardSettingsPanel(cardId: CardId, settings: CardSettingsMap | undefined): string {
  const active = settings?.[cardId] as Record<string, unknown> | undefined;
  switch (cardId) {
    case "watchlist": {
      const cols = Array.isArray(active?.["visibleColumns"])
        ? (active?.["visibleColumns"] as string[])
        : ["ticker", "price", "change", "consensus"];
      const autoRefreshSec = num(active?.["autoRefreshSec"], 60);
      const density = str(active?.["density"], "comfortable");
      return `
        <div class="card-settings-grid">
          <label>Visible columns (comma-separated)
            <input id="card-settings-visibleColumns" type="text" value="${escapeAttr(cols.join(","))}" />
          </label>
          <label>Auto-refresh (sec)
            <input id="card-settings-autoRefreshSec" type="number" min="5" max="3600" value="${autoRefreshSec}" />
          </label>
          <label>Density
            <select id="card-settings-density">
              <option value="comfortable"${density === "comfortable" ? " selected" : ""}>Comfortable</option>
              <option value="compact"${density === "compact" ? " selected" : ""}>Compact</option>
            </select>
          </label>
        </div>`;
    }
    case "chart": {
      const interval = str(active?.["defaultInterval"], "1d");
      const indicatorSet = Array.isArray(active?.["indicatorSet"])
        ? (active?.["indicatorSet"] as string[])
        : ["SMA50", "SMA200"];
      const crosshair = bool(active?.["crosshairSnap"], true);
      return `
        <div class="card-settings-grid">
          <label>Default interval
            <select id="card-settings-defaultInterval">
              <option value="1d"${interval === "1d" ? " selected" : ""}>1D</option>
              <option value="1w"${interval === "1w" ? " selected" : ""}>1W</option>
              <option value="1m"${interval === "1m" ? " selected" : ""}>1M</option>
            </select>
          </label>
          <label>Indicators (comma-separated)
            <input id="card-settings-indicatorSet" type="text" value="${escapeAttr(indicatorSet.join(","))}" />
          </label>
          <label><input id="card-settings-crosshairSnap" type="checkbox"${crosshair ? " checked" : ""} /> Crosshair snap</label>
        </div>`;
    }
    case "consensus": {
      return simpleThreeInputs(
        "methodsToDisplay",
        "historyDepth",
        "methods,comma-separated",
        active,
        "50",
      );
    }
    case "screener": {
      return simpleThreeInputs("defaultPreset", "maxResults", "sortColumn", active, "100");
    }
    case "heatmap": {
      return simpleThreeInputs("colorScale", "cellLabelFormat", "", active, "");
    }
    case "backtest": {
      return simpleThreeInputs("defaultStrategy", "lookbackWindow", "benchmark", active, "120");
    }
    case "alerts": {
      return simpleThreeInputs("thresholdType", "notificationChannel", "", active, "");
    }
    case "portfolio": {
      return simpleThreeInputs("benchmarkTicker", "displayCurrency", "", active, "");
    }
    case "risk": {
      return simpleThreeInputs("varConfidence", "benchmark", "", active, "0.95");
    }
  }
}

function simpleThreeInputs(
  a: string,
  b: string,
  c: string,
  active: Record<string, unknown> | undefined,
  bDefault: string,
): string {
  const av = active?.[a] == null ? "" : String(active[a]);
  const bv = active?.[b] == null ? bDefault : String(active[b]);
  const cv = c ? (active?.[c] == null ? "" : String(active[c])) : "";
  return `<div class="card-settings-grid">
    <label>${a}<input id="card-settings-${a}" type="text" value="${escapeAttr(av)}" /></label>
    <label>${b}<input id="card-settings-${b}" type="text" value="${escapeAttr(bv)}" /></label>
    ${c ? `<label>${c}<input id="card-settings-${c}" type="text" value="${escapeAttr(cv)}" /></label>` : ""}
  </div>`;
}

function readCardSettingsFromPanel(
  cardId: CardId,
  root: HTMLElement,
): Record<string, unknown> | undefined {
  const q = (id: string): HTMLInputElement | HTMLSelectElement | null =>
    root.querySelector(`#card-settings-${id}`);

  switch (cardId) {
    case "watchlist": {
      const visibleColumns = String((q("visibleColumns") as HTMLInputElement | null)?.value ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const autoRefreshSec = num((q("autoRefreshSec") as HTMLInputElement | null)?.value, 60);
      const density = str((q("density") as HTMLSelectElement | null)?.value, "comfortable");
      return { visibleColumns, autoRefreshSec, density };
    }
    case "chart": {
      const defaultInterval = str((q("defaultInterval") as HTMLSelectElement | null)?.value, "1d");
      const indicatorSet = String((q("indicatorSet") as HTMLInputElement | null)?.value ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const crosshairSnap = Boolean((q("crosshairSnap") as HTMLInputElement | null)?.checked);
      return { defaultInterval, indicatorSet, crosshairSnap };
    }
    case "consensus":
      return {
        methodsToDisplay: String((q("methodsToDisplay") as HTMLInputElement | null)?.value ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        historyDepth: num((q("historyDepth") as HTMLInputElement | null)?.value, 50),
      };
    case "screener":
      return {
        defaultPreset: str((q("defaultPreset") as HTMLInputElement | null)?.value, "balanced"),
        maxResults: num((q("maxResults") as HTMLInputElement | null)?.value, 100),
        sortColumn: str((q("sortColumn") as HTMLInputElement | null)?.value, "ticker"),
      };
    case "heatmap":
      return {
        colorScale: str((q("colorScale") as HTMLInputElement | null)?.value, "diverging"),
        cellLabelFormat: str((q("cellLabelFormat") as HTMLInputElement | null)?.value, "ticker"),
      };
    case "backtest":
      return {
        defaultStrategy: str((q("defaultStrategy") as HTMLInputElement | null)?.value, "consensus"),
        lookbackWindow: num((q("lookbackWindow") as HTMLInputElement | null)?.value, 120),
        benchmark: str((q("benchmark") as HTMLInputElement | null)?.value, "SPY"),
      };
    case "alerts":
      return {
        thresholdType: str((q("thresholdType") as HTMLInputElement | null)?.value, "percent"),
        notificationChannel: str(
          (q("notificationChannel") as HTMLInputElement | null)?.value,
          "toast",
        ),
      };
    case "portfolio":
      return {
        benchmarkTicker: str((q("benchmarkTicker") as HTMLInputElement | null)?.value, "SPY"),
        displayCurrency: str((q("displayCurrency") as HTMLInputElement | null)?.value, "USD"),
      };
    case "risk":
      return {
        varConfidence: num((q("varConfidence") as HTMLInputElement | null)?.value, 0.95),
        benchmark: str((q("benchmark") as HTMLInputElement | null)?.value, "SPY"),
      };
  }
}

function num(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function str(v: unknown, fallback: string): string {
  return typeof v === "string" && v.length > 0 ? v : fallback;
}

function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}
