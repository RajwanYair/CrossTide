/**
 * Curated color palettes optimized for color-blind accessibility.
 * Sources: Wong (2011) "Color blindness" Nature Methods + Paul Tol's
 * qualitative scheme. All palettes provide at minimum: bullish, bearish,
 * neutral, accent1, accent2, accent3, warning, info.
 *
 * Runtime activation (C2):
 *   `applyPalette(name)` — writes palette values to CSS custom properties on
 *   `document.documentElement` so every component that references `var(--color-bullish)`
 *   etc. automatically re-renders in the new palette.
 *   `persistPalette` / `loadPalette` — localStorage round-trip.
 *   `activatePaletteFromStorage` — call once on startup to restore the user's choice.
 */

export type PaletteName = "default" | "deuteranopia" | "protanopia" | "tritanopia";

export type SemanticColor =
  | "bullish"
  | "bearish"
  | "neutral"
  | "accent1"
  | "accent2"
  | "accent3"
  | "warning"
  | "info";

export type Palette = Readonly<Record<SemanticColor, string>>;

const DEFAULT: Palette = {
  bullish: "#16a34a",
  bearish: "#dc2626",
  neutral: "#6b7280",
  accent1: "#2563eb",
  accent2: "#9333ea",
  accent3: "#ea580c",
  warning: "#f59e0b",
  info: "#0891b2",
};

// Wong palette: orange/sky/green/yellow/blue/vermillion/purple
const DEUTERANOPIA: Palette = {
  bullish: "#0072b2", // blue (red/green confused, swap to blue)
  bearish: "#d55e00", // vermillion
  neutral: "#999999",
  accent1: "#56b4e9",
  accent2: "#cc79a7",
  accent3: "#f0e442",
  warning: "#e69f00",
  info: "#009e73",
};

const PROTANOPIA: Palette = {
  bullish: "#0072b2",
  bearish: "#e69f00", // orange (red dimmed in protanopia)
  neutral: "#999999",
  accent1: "#009e73",
  accent2: "#cc79a7",
  accent3: "#f0e442",
  warning: "#d55e00",
  info: "#56b4e9",
};

const TRITANOPIA: Palette = {
  bullish: "#d81b60", // pink/magenta (green confused with blue)
  bearish: "#1e88e5",
  neutral: "#757575",
  accent1: "#ffc107",
  accent2: "#004d40",
  accent3: "#5e35b1",
  warning: "#ff6f00",
  info: "#00897b",
};

const PALETTES: Readonly<Record<PaletteName, Palette>> = {
  default: DEFAULT,
  deuteranopia: DEUTERANOPIA,
  protanopia: PROTANOPIA,
  tritanopia: TRITANOPIA,
};

export function getPalette(name: PaletteName): Palette {
  return PALETTES[name];
}

export function pickColor(palette: PaletteName, kind: SemanticColor): string {
  return PALETTES[palette][kind];
}

export const PALETTE_NAMES: readonly PaletteName[] = [
  "default",
  "deuteranopia",
  "protanopia",
  "tritanopia",
];

const HEX_RE = /^#[0-9a-f]{6}$/i;

export function isHexColor(value: string): boolean {
  return HEX_RE.test(value);
}

// ── Runtime palette activation (C2) ──────────────────────────────────────────

const STORAGE_KEY = "ct_palette";

/**
 * CSS custom property prefix. Each SemanticColor maps to `--color-<name>`.
 *
 * For example `bullish` → `--color-bullish`.
 */
function cssVar(kind: SemanticColor): string {
  return `--color-${kind}`;
}

/**
 * Apply a palette by writing its hex values to CSS custom properties on the
 * document root element. Every component that references `var(--color-bullish)`
 * etc. will automatically inherit the new colors without a page reload.
 *
 * @param name  The palette to activate.
 * @param root  DOM element to set properties on (defaults to `document.documentElement`).
 */
export function applyPalette(
  name: PaletteName,
  root: HTMLElement = document.documentElement,
): void {
  const palette = getPalette(name);
  for (const [kind, hex] of Object.entries(palette) as [SemanticColor, string][]) {
    root.style.setProperty(cssVar(kind), hex);
  }
  root.setAttribute("data-palette", name);
}

/**
 * Persist the user's palette choice to localStorage.
 */
export function persistPalette(name: PaletteName): void {
  try {
    localStorage.setItem(STORAGE_KEY, name);
  } catch {
    // localStorage unavailable — silently skip
  }
}

/**
 * Load the persisted palette from localStorage.
 * Returns `null` if nothing is saved or the stored value is not a valid palette name.
 */
export function loadPalette(): PaletteName | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null && (PALETTE_NAMES as readonly string[]).includes(raw)) {
      return raw as PaletteName;
    }
  } catch {
    // localStorage unavailable
  }
  return null;
}

/**
 * Activate the palette from localStorage (if any) on page startup.
 * Call once from `main.ts` before any card renders.
 *
 * @returns The palette name that was activated, or `null` if nothing was stored.
 */
export function activatePaletteFromStorage(): PaletteName | null {
  const name = loadPalette();
  if (name !== null) {
    applyPalette(name);
  }
  return name;
}
