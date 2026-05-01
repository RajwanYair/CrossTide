/**
 * Screener card adapter — CardModule wrapper with preset filter support.
 *
 * Renders preset buttons and a results table.
 * Uses mock ticker data; will connect to real provider data in Phase B.
 */
import type { CardModule } from "./registry";
import { PRESET_FILTERS, type PresetFilter } from "./preset-filters";
import { applyFilters, renderScreenerResults, type ScreenerInput } from "./screener";

// Representative mock data (RSI / volume / SMA values)
const MOCK_INPUTS: readonly ScreenerInput[] = [
  { ticker: "AAPL", price: 192.5, consensus: "BUY", rsi: 45, volumeRatio: 1.1, smaValues: new Map([[50, 185], [200, 170]]) },
  { ticker: "MSFT", price: 415.0, consensus: "BUY", rsi: 62, volumeRatio: 0.9, smaValues: new Map([[50, 400], [200, 380]]) },
  { ticker: "NVDA", price: 880.0, consensus: "BUY", rsi: 72, volumeRatio: 2.3, smaValues: new Map([[50, 820], [200, 650]]) },
  { ticker: "TSLA", price: 175.0, consensus: "SELL", rsi: 38, volumeRatio: 1.6, smaValues: new Map([[50, 190], [200, 210]]) },
  { ticker: "META", price: 510.0, consensus: "BUY", rsi: 55, volumeRatio: 1.0, smaValues: new Map([[50, 490], [200, 420]]) },
  { ticker: "AMZN", price: 185.0, consensus: "BUY", rsi: 28, volumeRatio: 1.4, smaValues: new Map([[50, 180], [200, 160]]) },
  { ticker: "GOOG", price: 155.0, consensus: "NEUTRAL", rsi: 50, volumeRatio: 0.8, smaValues: new Map([[50, 150], [200, 140]]) },
  { ticker: "JPM", price: 198.0, consensus: "BUY", rsi: 60, volumeRatio: 2.1, smaValues: new Map([[50, 190], [200, 175]]) },
  { ticker: "XOM", price: 112.0, consensus: "SELL", rsi: 74, volumeRatio: 0.7, smaValues: new Map([[50, 108], [200, 105]]) },
  { ticker: "DIS", price: 105.0, consensus: "NEUTRAL", rsi: 42, volumeRatio: 1.2, smaValues: new Map([[50, 110], [200, 115]]) },
];

function renderPresetButtons(container: HTMLElement, onSelect: (preset: PresetFilter) => void): void {
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

    const resultsSection = document.createElement("div");
    resultsSection.className = "screener-results";
    container.appendChild(resultsSection);

    // Render preset buttons
    renderPresetButtons(presetSection, (preset) => {
      // Highlight active button
      presetSection.querySelectorAll(".preset-btn").forEach((b) => b.classList.remove("active"));
      const idx = PRESET_FILTERS.indexOf(preset);
      const btns = presetSection.querySelectorAll(".preset-btn");
      btns[idx]?.classList.add("active");

      // Apply filter and render
      const rows = applyFilters(MOCK_INPUTS, preset.filters);
      renderScreenerResults(resultsSection, rows);
    });

    // Show initial empty state
    resultsSection.innerHTML = `<p class="empty-state">Select a preset filter above to screen tickers.</p>`;

    return {};
  },
};

export default screenerCard;
