/**
 * Curated color palettes optimized for color-blind accessibility.
 * Sources: Wong (2011) "Color blindness" Nature Methods + Paul Tol's
 * qualitative scheme. All palettes provide at minimum: bullish, bearish,
 * neutral, accent1, accent2, accent3, warning, info.
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
