/**
 * Screener data bridge — shared state between main.ts and screener-card.ts.
 *
 * Avoids static import of the full card module from main.ts,
 * allowing the card chunk to remain lazily loaded.
 */
import type { ScreenerInput } from "./screener";

let liveInputs: readonly ScreenerInput[] = [];

/**
 * Update the screener's ticker data. Call after every data refresh cycle.
 */
export function setScreenerData(inputs: readonly ScreenerInput[]): void {
  liveInputs = inputs;
}

/**
 * Read current screener data (used by screener-card at render time).
 */
export function getScreenerData(): readonly ScreenerInput[] {
  return liveInputs;
}
