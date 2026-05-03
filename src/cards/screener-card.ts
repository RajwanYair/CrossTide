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

function renderPresetButtons(
  container: HTMLElement,
  onSelect: (preset: PresetFilter) => void,
): void {
  const wrapper = document.createElement("div");
  wrapper.className = "screener-presets";
  for (const preset of PRESET_FILTERS) {
    const btn = document.createElement("button");
    btn.className = "preset-btn";
    btn.textContent = preset.name;
    btn.title = preset.description;
    btn.addEventListener("click", () => onSelect(preset));
    wrapper.appendChild(btn);
  }
  container.appendChild(wrapper);
}

const screenerCard: CardModule = {
  mount(container, _ctx) {
    container.innerHTML = "";

    const presetSection = document.createElement("div");
    presetSection.className = "screener-controls";
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

    // Render preset buttons
    renderPresetButtons(presetSection, (preset) => {
      activePreset = preset;
      // Highlight active button
      presetSection.querySelectorAll(".preset-btn").forEach((b) => b.classList.remove("active"));
      const idx = PRESET_FILTERS.indexOf(preset);
      const btns = presetSection.querySelectorAll(".preset-btn");
      btns[idx]?.classList.add("active");

      // Apply filter against live data and render
      const inputs = getScreenerData();
      const rows = applyFilters(inputs, preset.filters);
      renderScreenerResults(resultsSection, rows, visibleCols, inputs);
    });

    // Show initial empty state
    const currentData = getScreenerData();
    if (currentData.length === 0) {
      resultsSection.innerHTML = `<p class="empty-state">Add tickers to your watchlist to screen them here.</p>`;
    } else {
      resultsSection.innerHTML = `<p class="empty-state">Select a preset filter above to screen ${currentData.length} tickers.</p>`;
    }

    return {};
  },
};

export default screenerCard;
