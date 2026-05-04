/**
 * Screener card adapter — CardModule wrapper with preset filter support.
 *
 * Renders preset buttons, column toggles, and a results table.
 * Screener inputs are populated from live watchlist data via screener-data bridge.
 */
import type { CardModule } from "./registry";
import { PRESET_FILTERS, type PresetFilter } from "./preset-filters";
import { applyFilters, renderScreenerResults } from "./screener";
import { getScreenerData } from "./screener-data";
import {
  loadVisibleColumns,
  saveVisibleColumns,
  renderColumnToggles,
  type ScreenerColumn,
} from "./screener-columns";
import { patchDOM } from "../core/patch-dom";
import { createDelegate } from "../ui/delegate";

function renderPresetButtonsHtml(): string {
  return `<div class="screener-presets">${PRESET_FILTERS.map(
    (p, i) =>
      `<button class="preset-btn" data-action="select-preset" data-index="${i}" title="${p.description}">${p.name}</button>`,
  ).join("")}</div>`;
}

const screenerCard: CardModule = {
  mount(container, _ctx) {
    container.textContent = "";

    const presetSection = document.createElement("div");
    presetSection.className = "screener-controls";
    patchDOM(presetSection, renderPresetButtonsHtml());
    container.appendChild(presetSection);

    // Column toggle section
    const visibleCols = loadVisibleColumns();
    let activePreset: PresetFilter | null = null;

    const rerender = (): void => {
      if (!activePreset) return;
      const inputs = getScreenerData();
      const rows = applyFilters(inputs, activePreset.filters);
      renderScreenerResults(resultsSection, rows, visibleCols, inputs);
    };

    const togglePanel = renderColumnToggles(
      visibleCols,
      (col: ScreenerColumn, checked: boolean) => {
        if (checked) {
          visibleCols.add(col);
        } else {
          visibleCols.delete(col);
        }
        saveVisibleColumns(visibleCols);
        rerender();
      },
    );
    container.appendChild(togglePanel);

    const resultsSection = document.createElement("div");
    resultsSection.className = "screener-results";
    container.appendChild(resultsSection);

    // Event delegation for preset buttons
    const delegate = createDelegate(
      presetSection,
      {
        "select-preset": (target) => {
          const idx = Number(target.dataset["index"]);
          const preset = PRESET_FILTERS[idx];
          if (!preset) return;
          activePreset = preset;
          // Highlight active button
          presetSection
            .querySelectorAll(".preset-btn")
            .forEach((b) => b.classList.remove("active"));
          target.classList.add("active");
          // Apply filter against live data and render
          const inputs = getScreenerData();
          const rows = applyFilters(inputs, preset.filters);
          renderScreenerResults(resultsSection, rows, visibleCols, inputs);
        },
      },
      { eventTypes: ["click"] },
    );

    // Show initial empty state
    const currentData = getScreenerData();
    if (currentData.length === 0) {
      patchDOM(
        resultsSection,
        `<p class="empty-state">Add tickers to your watchlist to screen them here.</p>`,
      );
    } else {
      patchDOM(
        resultsSection,
        `<p class="empty-state">Select a preset filter above to screen ${currentData.length} tickers.</p>`,
      );
    }

    return { dispose: () => delegate.dispose() };
  },
};

export default screenerCard;
