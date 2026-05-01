/**
 * Palette switcher — applies a color-blind / high-contrast palette to the
 * document by setting `data-palette` on `<html>`, and persists the choice
 * to localStorage.
 *
 * Available palettes:
 *   "default"        — standard dark/light theme colors
 *   "deuteranopia"   — red-green safe (blue/vermillion)
 *   "protanopia"     — red-blind safe (blue/amber-orange)
 *   "tritanopia"     — blue-yellow safe (magenta/blue)
 *   "high-contrast"  — maximum contrast for low-vision users
 */

import type { PaletteName } from "./palettes";

export type { PaletteName };

/** Extended palette names — adds high-contrast to those in palettes.ts */
export type ExtendedPaletteName = PaletteName | "high-contrast";

const STORAGE_KEY = "crosstide-palette";

/** Retrieve the currently active palette (reads from <html> data attribute). */
export function getActivePalette(): ExtendedPaletteName {
  const attr = document.documentElement.dataset["palette"];
  if (isValidPalette(attr)) return attr;
  return "default";
}

/** Apply a palette by setting `data-palette` on `<html>`. */
export function applyPalette(name: ExtendedPaletteName): void {
  if (name === "default") {
    delete document.documentElement.dataset["palette"];
  } else {
    document.documentElement.dataset["palette"] = name;
  }
  localStorage.setItem(STORAGE_KEY, name);
}

/** Load and apply the persisted palette on app startup. */
export function loadPersistedPalette(): void {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && isValidPalette(saved)) {
    applyPalette(saved);
  }
}

const VALID_PALETTES: readonly ExtendedPaletteName[] = [
  "default",
  "deuteranopia",
  "protanopia",
  "tritanopia",
  "high-contrast",
];

function isValidPalette(value: string | undefined): value is ExtendedPaletteName {
  return typeof value === "string" && (VALID_PALETTES as readonly string[]).includes(value);
}

export { VALID_PALETTES };

/** Human-readable label for each palette. */
export const PALETTE_LABELS: Readonly<Record<ExtendedPaletteName, string>> = {
  default: "Default",
  deuteranopia: "Deuteranopia (red-green safe)",
  protanopia: "Protanopia (red-blind safe)",
  tritanopia: "Tritanopia (blue-yellow safe)",
  "high-contrast": "High contrast",
};
