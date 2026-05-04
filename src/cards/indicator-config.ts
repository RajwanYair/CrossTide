/**
 * Indicator configuration — per-indicator period/threshold settings.
 *
 * Persists user preferences to localStorage. Provides defaults for all
 * supported indicators and a UI panel for editing values.
 */

export interface SmaConfig {
  readonly fastPeriod: number;
  readonly slowPeriod: number;
}

export interface RsiConfig {
  readonly period: number;
  readonly overbought: number;
  readonly oversold: number;
}

export interface BollingerConfig {
  readonly period: number;
  readonly multiplier: number;
}

export interface MacdConfig {
  readonly fastPeriod: number;
  readonly slowPeriod: number;
  readonly signalPeriod: number;
}

export interface IndicatorConfig {
  readonly sma: SmaConfig;
  readonly rsi: RsiConfig;
  readonly bollinger: BollingerConfig;
  readonly macd: MacdConfig;
}

const STORAGE_KEY = "crosstide-indicator-config";

export const DEFAULT_CONFIG: IndicatorConfig = {
  sma: { fastPeriod: 50, slowPeriod: 200 },
  rsi: { period: 14, overbought: 70, oversold: 30 },
  bollinger: { period: 20, multiplier: 2 },
  macd: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
};

export function loadIndicatorConfig(): IndicatorConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<IndicatorConfig>;
      return {
        sma: { ...DEFAULT_CONFIG.sma, ...parsed.sma },
        rsi: { ...DEFAULT_CONFIG.rsi, ...parsed.rsi },
        bollinger: { ...DEFAULT_CONFIG.bollinger, ...parsed.bollinger },
        macd: { ...DEFAULT_CONFIG.macd, ...parsed.macd },
      };
    }
  } catch {
    // Fall through to defaults
  }
  return DEFAULT_CONFIG;
}

export function saveIndicatorConfig(config: IndicatorConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function resetIndicatorConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}

interface FieldDef {
  readonly key: string;
  readonly label: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
}

interface SectionDef {
  readonly id: keyof IndicatorConfig;
  readonly title: string;
  readonly fields: readonly FieldDef[];
}

const SECTIONS: readonly SectionDef[] = [
  {
    id: "sma",
    title: "SMA",
    fields: [
      { key: "fastPeriod", label: "Fast Period", min: 5, max: 100, step: 1 },
      { key: "slowPeriod", label: "Slow Period", min: 50, max: 400, step: 1 },
    ],
  },
  {
    id: "rsi",
    title: "RSI",
    fields: [
      { key: "period", label: "Period", min: 2, max: 50, step: 1 },
      { key: "overbought", label: "Overbought", min: 50, max: 95, step: 1 },
      { key: "oversold", label: "Oversold", min: 5, max: 50, step: 1 },
    ],
  },
  {
    id: "bollinger",
    title: "Bollinger Bands",
    fields: [
      { key: "period", label: "Period", min: 5, max: 50, step: 1 },
      { key: "multiplier", label: "Multiplier", min: 0.5, max: 4, step: 0.1 },
    ],
  },
  {
    id: "macd",
    title: "MACD",
    fields: [
      { key: "fastPeriod", label: "Fast EMA", min: 2, max: 50, step: 1 },
      { key: "slowPeriod", label: "Slow EMA", min: 10, max: 100, step: 1 },
      { key: "signalPeriod", label: "Signal", min: 2, max: 50, step: 1 },
    ],
  },
];

/**
 * Render the indicator configuration panel into a container element.
 * Returns a dispose function to remove event listeners.
 */
export function renderIndicatorConfigPanel(
  container: HTMLElement,
  onChange?: (config: IndicatorConfig) => void,
): () => void {
  let config = loadIndicatorConfig();

  const renderHtml = (): string => {
    const sections = SECTIONS.map((section) => {
      const sectionConfig = config[section.id] as Record<string, number>;
      const fields = section.fields
        .map(
          (f) =>
            `<label class="indicator-field">
          <span class="indicator-field-label">${f.label}</span>
          <input type="number" class="indicator-field-input"
            data-section="${section.id}" data-key="${f.key}"
            min="${f.min}" max="${f.max}" step="${f.step}"
            value="${sectionConfig[f.key] ?? 0}" />
        </label>`,
        )
        .join("");
      return `<fieldset class="indicator-section">
        <legend>${section.title}</legend>
        ${fields}
      </fieldset>`;
    }).join("");

    return `<div class="indicator-config-panel">
      ${sections}
      <div class="indicator-config-actions">
        <button type="button" class="btn-reset" data-action="reset-indicators">Reset Defaults</button>
      </div>
    </div>`;
  };

  container.innerHTML = renderHtml();

  const handleInput = (e: Event): void => {
    const target = e.target as HTMLInputElement;
    if (!target.dataset["section"] || !target.dataset["key"]) return;
    const section = target.dataset["section"] as keyof IndicatorConfig;
    const key = target.dataset["key"];
    const value = Number(target.value);
    if (Number.isNaN(value)) return;

    const sectionConfig = { ...config[section] } as Record<string, number>;
    sectionConfig[key] = value;
    config = { ...config, [section]: sectionConfig };
    saveIndicatorConfig(config);
    onChange?.(config);
  };

  const handleClick = (e: Event): void => {
    const target = e.target as HTMLElement;
    if (target.dataset["action"] === "reset-indicators") {
      resetIndicatorConfig();
      config = DEFAULT_CONFIG;
      container.innerHTML = renderHtml();
      onChange?.(config);
    }
  };

  container.addEventListener("input", handleInput);
  container.addEventListener("click", handleClick);

  return (): void => {
    container.removeEventListener("input", handleInput);
    container.removeEventListener("click", handleClick);
  };
}
