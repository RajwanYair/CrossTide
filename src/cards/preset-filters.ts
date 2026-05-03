/**
 * Preset Screener Filters — built-in filter combinations.
 *
 * Each preset is a named collection of ScreenerFilter objects ready to use
 * with the screener card's applyFilters function.
 */
import type { ScreenerFilter } from "./screener";
import { createDelegate, type DelegateHandle } from "../ui/delegate";

export interface PresetFilter {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly filters: readonly ScreenerFilter[];
}

/**
 * Built-in preset filter library.
 */
export const PRESET_FILTERS: readonly PresetFilter[] = [
  {
    id: "oversold-buy",
    name: "Oversold Bounce",
    description: "RSI below 30 with consensus BUY — potential reversal candidates",
    filters: [
      { type: "rsiBelow", threshold: 30 },
      { type: "consensus", direction: "BUY" },
    ],
  },
  {
    id: "overbought-sell",
    name: "Overbought Warning",
    description: "RSI above 70 with consensus SELL — potential pullback candidates",
    filters: [
      { type: "rsiAbove", threshold: 70 },
      { type: "consensus", direction: "SELL" },
    ],
  },
  {
    id: "trend-following",
    name: "Trend Following",
    description: "Price above SMA200 with consensus BUY — strong uptrend",
    filters: [
      { type: "priceAboveSma", period: 200 },
      { type: "consensus", direction: "BUY" },
    ],
  },
  {
    id: "volume-breakout",
    name: "Volume Breakout",
    description: "Volume spike 2x average with consensus BUY — breakout signal",
    filters: [
      { type: "volumeSpike", multiplier: 2 },
      { type: "consensus", direction: "BUY" },
    ],
  },
  {
    id: "high-volume",
    name: "High Volume",
    description: "Volume at least 1.5x average — unusual activity",
    filters: [{ type: "volumeSpike", multiplier: 1.5 }],
  },
  {
    id: "strong-buy",
    name: "Strong Buy",
    description: "Consensus BUY with RSI below 50 and price above SMA50",
    filters: [
      { type: "consensus", direction: "BUY" },
      { type: "rsiBelow", threshold: 50 },
      { type: "priceAboveSma", period: 50 },
    ],
  },
];

/**
 * Look up a preset by id.
 */
export function getPresetById(id: string): PresetFilter | undefined {
  return PRESET_FILTERS.find((p) => p.id === id);
}

/**
 * Render a preset picker into a container.
 */
export function renderPresetPicker(
  container: HTMLElement,
  onSelect: (preset: PresetFilter) => void,
): DelegateHandle {
  const buttons = PRESET_FILTERS.map(
    (p) =>
      `<button class="preset-btn" data-action="select-preset" data-preset-id="${p.id}" type="button" title="${escapeAttr(p.description)}">
        ${escapeHtml(p.name)}
      </button>`,
  ).join("");

  container.innerHTML = `
    <div class="preset-picker" role="group" aria-label="Screener Presets">
      ${buttons}
    </div>
  `;

  return createDelegate(container, {
    "select-preset": (target) => {
      const preset = getPresetById(target.dataset["presetId"] ?? "");
      if (preset) onSelect(preset);
    },
  });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/"/g, "&quot;");
}
