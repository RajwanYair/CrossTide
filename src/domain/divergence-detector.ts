/**
 * Divergence Detector — detect bullish and bearish divergences
 * between price and an oscillator (RSI, MACD histogram, etc.).
 *
 * A **bullish divergence** occurs when price makes a lower low but
 * the oscillator makes a higher low (momentum weakening to downside).
 *
 * A **bearish divergence** occurs when price makes a higher high but
 * the oscillator makes a lower high (momentum weakening to upside).
 *
 * Pure function: no I/O, no DOM, no Date.now().
 */
import type { DailyCandle } from "../types/domain";

export type DivergenceType = "bullish" | "bearish";

export interface Divergence {
  readonly type: DivergenceType;
  /** Index of the first pivot in the candle array. */
  readonly startIndex: number;
  /** Index of the second pivot (confirmation point). */
  readonly endIndex: number;
  /** Price at the first pivot. */
  readonly priceStart: number;
  /** Price at the second pivot. */
  readonly priceEnd: number;
  /** Oscillator value at the first pivot. */
  readonly oscillatorStart: number;
  /** Oscillator value at the second pivot. */
  readonly oscillatorEnd: number;
}

export interface DivergenceOptions {
  /**
   * Minimum number of bars between the two pivots.
   * @default 5
   */
  readonly minDistance?: number;
  /**
   * Maximum number of bars between the two pivots.
   * @default 60
   */
  readonly maxDistance?: number;
  /**
   * Number of bars on each side required to confirm a pivot.
   * @default 3
   */
  readonly pivotStrength?: number;
}

/**
 * Detect all divergences between price and the given oscillator series.
 *
 * @param candles  OHLCV candle array.
 * @param oscillator  Oscillator values aligned 1:1 with candles (same length).
 * @param options  Detection parameters.
 * @returns Array of detected divergences, ordered by endIndex ascending.
 */
export function detectDivergences(
  candles: readonly DailyCandle[],
  oscillator: readonly (number | null)[],
  options?: DivergenceOptions,
): Divergence[] {
  const minDist = options?.minDistance ?? 5;
  const maxDist = options?.maxDistance ?? 60;
  const strength = options?.pivotStrength ?? 3;

  if (candles.length !== oscillator.length || candles.length < strength * 2 + 1) {
    return [];
  }

  const priceLows = findPivotLows(
    candles.map((c) => c.low),
    strength,
  );
  const priceHighs = findPivotHighs(
    candles.map((c) => c.high),
    strength,
  );
  const oscLows = findPivotLows(oscillator, strength);
  const oscHighs = findPivotHighs(oscillator, strength);

  const divergences: Divergence[] = [];

  // Bullish: price lower-low + oscillator higher-low
  for (let i = 0; i < priceLows.length - 1; i++) {
    for (let j = i + 1; j < priceLows.length; j++) {
      const pi = priceLows[i]!;
      const pj = priceLows[j]!;
      const dist = pj.index - pi.index;
      if (dist < minDist) continue;
      if (dist > maxDist) break;

      // Price makes lower low
      if (pj.value >= pi.value) continue;

      // Find oscillator lows near these price pivots
      const oscA = findNearest(oscLows, pi.index, strength);
      const oscB = findNearest(oscLows, pj.index, strength);
      if (oscA === null || oscB === null) continue;

      // Oscillator makes higher low
      if (oscB.value > oscA.value) {
        divergences.push({
          type: "bullish",
          startIndex: pi.index,
          endIndex: pj.index,
          priceStart: pi.value,
          priceEnd: pj.value,
          oscillatorStart: oscA.value,
          oscillatorEnd: oscB.value,
        });
      }
    }
  }

  // Bearish: price higher-high + oscillator lower-high
  for (let i = 0; i < priceHighs.length - 1; i++) {
    for (let j = i + 1; j < priceHighs.length; j++) {
      const pi = priceHighs[i]!;
      const pj = priceHighs[j]!;
      const dist = pj.index - pi.index;
      if (dist < minDist) continue;
      if (dist > maxDist) break;

      // Price makes higher high
      if (pj.value <= pi.value) continue;

      // Find oscillator highs near these price pivots
      const oscA = findNearest(oscHighs, pi.index, strength);
      const oscB = findNearest(oscHighs, pj.index, strength);
      if (oscA === null || oscB === null) continue;

      // Oscillator makes lower high
      if (oscB.value < oscA.value) {
        divergences.push({
          type: "bearish",
          startIndex: pi.index,
          endIndex: pj.index,
          priceStart: pi.value,
          priceEnd: pj.value,
          oscillatorStart: oscA.value,
          oscillatorEnd: oscB.value,
        });
      }
    }
  }

  divergences.sort((a, b) => a.endIndex - b.endIndex);
  return divergences;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

interface Pivot {
  readonly index: number;
  readonly value: number;
}

function findPivotLows(series: readonly (number | null)[], strength: number): Pivot[] {
  const pivots: Pivot[] = [];
  for (let i = strength; i < series.length - strength; i++) {
    const val = series[i];
    if (val === null) continue;
    let isPivot = true;
    for (let j = 1; j <= strength; j++) {
      const left = series[i - j];
      const right = series[i + j];
      if (left === null || right === null || val > left || val > right) {
        isPivot = false;
        break;
      }
    }
    if (isPivot) pivots.push({ index: i, value: val });
  }
  return pivots;
}

function findPivotHighs(series: readonly (number | null)[], strength: number): Pivot[] {
  const pivots: Pivot[] = [];
  for (let i = strength; i < series.length - strength; i++) {
    const val = series[i];
    if (val === null) continue;
    let isPivot = true;
    for (let j = 1; j <= strength; j++) {
      const left = series[i - j];
      const right = series[i + j];
      if (left === null || right === null || val < left || val < right) {
        isPivot = false;
        break;
      }
    }
    if (isPivot) pivots.push({ index: i, value: val });
  }
  return pivots;
}

function findNearest(
  pivots: readonly Pivot[],
  targetIndex: number,
  tolerance: number,
): Pivot | null {
  let best: Pivot | null = null;
  let bestDist = Infinity;
  for (const p of pivots) {
    const dist = Math.abs(p.index - targetIndex);
    if (dist <= tolerance && dist < bestDist) {
      best = p;
      bestDist = dist;
    }
  }
  return best;
}
