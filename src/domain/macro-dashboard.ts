/**
 * Macro Dashboard domain — pure regime classification and formatters (H19).
 *
 * Provides VIX/DXY-based regime classification, macro ticker definitions,
 * and display helpers independent of any UI framework.
 */

// ─────────────────────────── Types ──────────────────────────────────────────

export type MacroRegime = "risk-on" | "risk-off" | "neutral";

export interface MacroTicker {
  /** Internal key (e.g. "vix") */
  key: string;
  /** Human-readable label */
  label: string;
  /** Market symbol used in API queries */
  symbol: string;
  /** Optional unit suffix (e.g. "%" for yields) */
  suffix?: string;
  /** Regime relevance: higher = more important for regime calculation */
  weight: number;
}

export interface MacroSnapshot {
  /** VIX current level */
  vix: number;
  /** DXY (US Dollar Index) 1-day change % */
  dxyChangePct: number;
  /** 10-year yield change % (optional) */
  us10yChangePct?: number;
}

// ─────────────────────────── Ticker catalogue ────────────────────────────────

/** Standard macro tickers shown on the Macro Dashboard card. */
export const MACRO_TICKERS: readonly MacroTicker[] = [
  { key: "vix", label: "VIX", symbol: "^VIX", weight: 3 },
  { key: "us10y", label: "US 10Y", symbol: "^TNX", weight: 2, suffix: "%" },
  { key: "dxy", label: "DXY", symbol: "DX-Y.NYB", weight: 2 },
  { key: "gold", label: "Gold", symbol: "GC=F", weight: 1 },
  { key: "wti", label: "WTI", symbol: "CL=F", weight: 1 },
];

/** Return the MacroTicker for a given key, or undefined. */
export function getMacroTicker(key: string): MacroTicker | undefined {
  return MACRO_TICKERS.find((t) => t.key === key);
}

// ─────────────────────────── Regime classification ───────────────────────────

/**
 * Classify the macro regime from VIX level and DXY day-over-day change.
 *
 * Rules (in priority order):
 *   risk-off  — VIX ≥ 22  OR  DXY daily change > +0.35%
 *   risk-on   — VIX ≤ 16  AND  DXY daily change ≤ 0%
 *   neutral   — otherwise
 */
export function classifyMacroRegime(vix: number, dxyChangePct: number): MacroRegime {
  if (vix >= 22 || dxyChangePct > 0.35) return "risk-off";
  if (vix <= 16 && dxyChangePct <= 0) return "risk-on";
  return "neutral";
}

/**
 * Extended regime classification that also factors in the 10-year yield.
 * A sharp rise in yields (> +2% on the day) upgrades any neutral to risk-off.
 */
export function classifyMacroRegimeExtended(snapshot: MacroSnapshot): MacroRegime {
  const base = classifyMacroRegime(snapshot.vix, snapshot.dxyChangePct);
  if (base === "risk-off") return "risk-off";
  if ((snapshot.us10yChangePct ?? 0) > 2) return "risk-off";
  return base;
}

// ─────────────────────────── Formatters ──────────────────────────────────────

/**
 * Format a percentage change for display.
 * Prepends "+" for positives, fixed to `decimals` places.
 */
export function formatMacroChange(pct: number, decimals = 2): string {
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(decimals)}%`;
}

/**
 * Human-readable regime label for display.
 */
export function regimeLabel(regime: MacroRegime): string {
  switch (regime) {
    case "risk-on":
      return "Risk On";
    case "risk-off":
      return "Risk Off";
    default:
      return "Neutral";
  }
}

/**
 * CSS class suffix for coloring regime badges.
 * Consumers apply "badge--risk-on" | "badge--risk-off" | "badge--neutral".
 */
export function regimeCssClass(regime: MacroRegime): string {
  return `badge--${regime}`;
}
