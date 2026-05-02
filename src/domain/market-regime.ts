/**
 * Market regime detection (I9).
 *
 * Rule-based macro-regime classifier that labels the current environment as
 * risk-on / risk-off / neutral using market breadth, volatility, and
 * inter-market signals.  This is intentionally simple (no ML) so the
 * classification is transparent and auditable.
 *
 * Exports:
 *   - `Regime` — enum: RiskOn | Neutral | RiskOff | Crisis
 *   - `classifyVix(vix)` — regime from VIX level
 *   - `classifyBreadth(advDecl)` — regime from advance/decline ratio
 *   - `classifyYieldCurve(short2y, long10y)` — regime from yield spread
 *   - `classifyDollar(dxyPctChg)` — regime from DXY % change
 *   - `combinedRegime(signals)` — majority-vote ensemble
 *   - `regimeLabel(r)` — human-readable label
 *   - `regimeColor(r)` — semantic colour token
 *   - `regimeScore(signals)` — numeric risk score (0–100)
 *   - `trendRegime(prices, span)` — regime from price trend
 *   - `volatilityRegime(returns)` — regime from realised vol
 */

// ── Types ─────────────────────────────────────────────────────────────────

export enum Regime {
  RiskOn = "risk-on",
  Neutral = "neutral",
  RiskOff = "risk-off",
  Crisis = "crisis",
}

export interface RegimeSignal {
  source: string;
  regime: Regime;
  confidence: number; // 0–1
}

// ── VIX classifier ───────────────────────────────────────────────────────

/**
 * Classify market regime from VIX level.
 *   - < 15  → RiskOn
 *   - 15–20 → Neutral
 *   - 20–30 → RiskOff
 *   - > 30  → Crisis
 */
export function classifyVix(vix: number): Regime {
  if (vix < 15) return Regime.RiskOn;
  if (vix <= 20) return Regime.Neutral;
  if (vix <= 30) return Regime.RiskOff;
  return Regime.Crisis;
}

// ── Breadth classifier ────────────────────────────────────────────────────

/**
 * Classify from advance/decline ratio.
 *   - > 1.5  → RiskOn
 *   - 0.8–1.5 → Neutral
 *   - 0.4–0.8 → RiskOff
 *   - < 0.4  → Crisis
 */
export function classifyBreadth(advDecl: number): Regime {
  if (advDecl > 1.5) return Regime.RiskOn;
  if (advDecl >= 0.8) return Regime.Neutral;
  if (advDecl >= 0.4) return Regime.RiskOff;
  return Regime.Crisis;
}

// ── Yield curve classifier ────────────────────────────────────────────────

/**
 * Classify from 2y–10y spread (basis points).
 *   - spread > 100  → RiskOn
 *   - 0–100         → Neutral
 *   - -50–0         → RiskOff
 *   - < -50         → Crisis
 */
export function classifyYieldCurve(short2y: number, long10y: number): Regime {
  const spread = (long10y - short2y) * 100; // convert to bps
  if (spread > 100) return Regime.RiskOn;
  if (spread >= 0) return Regime.Neutral;
  if (spread >= -50) return Regime.RiskOff;
  return Regime.Crisis;
}

// ── Dollar strength classifier ────────────────────────────────────────────

/**
 * Classify from DXY percentage change (trailing 20-day).
 * A strengthening dollar is typically risk-off for equities.
 *   - pctChg < -2  → RiskOn  (dollar weakening)
 *   - -2 to +2     → Neutral
 *   - +2 to +5     → RiskOff (dollar strengthening)
 *   - > +5         → Crisis  (flight to safety)
 */
export function classifyDollar(dxyPctChg: number): Regime {
  if (dxyPctChg < -2) return Regime.RiskOn;
  if (dxyPctChg <= 2) return Regime.Neutral;
  if (dxyPctChg <= 5) return Regime.RiskOff;
  return Regime.Crisis;
}

// ── Trend-based classifier ────────────────────────────────────────────────

/**
 * Classify regime from recent price trend using simple momentum.
 * Compares current price to the simple moving average over `span` periods.
 *
 * @param prices - Array of closing prices (oldest first).
 * @param span - Lookback period (default 50).
 */
export function trendRegime(prices: number[], span: number = 50): Regime {
  if (prices.length < span) return Regime.Neutral;
  const slice = prices.slice(-span);
  const sma = slice.reduce((s, v) => s + v, 0) / span;
  const current = prices[prices.length - 1];
  const deviation = ((current - sma) / sma) * 100;

  if (deviation > 5) return Regime.RiskOn;
  if (deviation > -2) return Regime.Neutral;
  if (deviation > -10) return Regime.RiskOff;
  return Regime.Crisis;
}

// ── Volatility regime classifier ──────────────────────────────────────────

/**
 * Classify regime from realised volatility of daily returns.
 *
 * @param returns - Array of daily log-returns.
 */
export function volatilityRegime(returns: number[]): Regime {
  if (returns.length < 2) return Regime.Neutral;
  const mean = returns.reduce((s, v) => s + v, 0) / returns.length;
  const variance = returns.reduce((s, v) => s + (v - mean) ** 2, 0) / returns.length;
  const annualisedVol = Math.sqrt(variance) * Math.sqrt(252) * 100;

  if (annualisedVol < 12) return Regime.RiskOn;
  if (annualisedVol < 20) return Regime.Neutral;
  if (annualisedVol < 35) return Regime.RiskOff;
  return Regime.Crisis;
}

// ── Ensemble ──────────────────────────────────────────────────────────────

const REGIME_ORDER = [Regime.RiskOn, Regime.Neutral, Regime.RiskOff, Regime.Crisis];

/**
 * Combine multiple regime signals via weighted majority vote.
 * Falls back to Neutral when signals are empty.
 */
export function combinedRegime(signals: RegimeSignal[]): Regime {
  if (signals.length === 0) return Regime.Neutral;

  const weights = new Map<Regime, number>();
  for (const r of REGIME_ORDER) weights.set(r, 0);

  for (const s of signals) {
    weights.set(s.regime, (weights.get(s.regime) ?? 0) + s.confidence);
  }

  let best = Regime.Neutral;
  let bestWeight = -1;
  for (const r of REGIME_ORDER) {
    const w = weights.get(r) ?? 0;
    if (w > bestWeight) {
      best = r;
      bestWeight = w;
    }
  }
  return best;
}

/**
 * Compute a numeric risk score from 0 (max risk-on) to 100 (max crisis).
 */
export function regimeScore(signals: RegimeSignal[]): number {
  if (signals.length === 0) return 50;
  const scoreMap: Record<Regime, number> = {
    [Regime.RiskOn]: 0,
    [Regime.Neutral]: 33,
    [Regime.RiskOff]: 66,
    [Regime.Crisis]: 100,
  };
  const totalWeight = signals.reduce((s, sig) => s + sig.confidence, 0);
  if (totalWeight === 0) return 50;
  const weighted = signals.reduce((s, sig) => s + scoreMap[sig.regime] * sig.confidence, 0);
  return Math.round(weighted / totalWeight);
}

// ── Labels and colours ────────────────────────────────────────────────────

const REGIME_LABELS: Record<Regime, string> = {
  [Regime.RiskOn]: "Risk-On",
  [Regime.Neutral]: "Neutral",
  [Regime.RiskOff]: "Risk-Off",
  [Regime.Crisis]: "Crisis",
};

const REGIME_COLORS: Record<Regime, string> = {
  [Regime.RiskOn]: "var(--color-success, #22c55e)",
  [Regime.Neutral]: "var(--color-info, #3b82f6)",
  [Regime.RiskOff]: "var(--color-warning, #f59e0b)",
  [Regime.Crisis]: "var(--color-danger, #ef4444)",
};

/** Human-readable label for a regime. */
export function regimeLabel(r: Regime): string {
  return REGIME_LABELS[r];
}

/** CSS colour token for a regime. */
export function regimeColor(r: Regime): string {
  return REGIME_COLORS[r];
}
