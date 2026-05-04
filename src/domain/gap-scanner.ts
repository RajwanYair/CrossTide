/**
 * Gap detection scanner — identify price gaps (open vs prev close)
 * for gap-fill trading strategies.
 */

export interface DayData {
  readonly date: string;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
}

export interface Gap {
  readonly date: string;
  readonly type: "gap-up" | "gap-down";
  readonly gapSize: number;
  readonly gapPercent: number;
  readonly prevClose: number;
  readonly open: number;
  readonly filled: boolean;
}

/**
 * Detect all gaps in a price series.
 * A gap occurs when open differs significantly from previous close.
 */
export function detectGaps(data: readonly DayData[], minGapPercent = 0.5): Gap[] {
  const gaps: Gap[] = [];

  for (let i = 1; i < data.length; i++) {
    const prev = data[i - 1]!;
    const curr = data[i]!;
    const gapSize = curr.open - prev.close;
    const gapPercent = prev.close !== 0 ? (gapSize / prev.close) * 100 : 0;

    if (Math.abs(gapPercent) < minGapPercent) continue;

    const type = gapSize > 0 ? "gap-up" : "gap-down";

    // Check if gap was filled during the day
    let filled: boolean;
    if (type === "gap-up") {
      filled = curr.low <= prev.close;
    } else {
      filled = curr.high >= prev.close;
    }

    gaps.push({
      date: curr.date,
      type,
      gapSize: Math.abs(gapSize),
      gapPercent: Math.abs(gapPercent),
      prevClose: prev.close,
      open: curr.open,
      filled,
    });
  }

  return gaps;
}

/**
 * Get only unfilled gaps (potential future fill targets).
 */
export function unfilledGaps(gaps: readonly Gap[]): Gap[] {
  return gaps.filter((g) => !g.filled);
}

/**
 * Get gap-up events only.
 */
export function gapUps(gaps: readonly Gap[]): Gap[] {
  return gaps.filter((g) => g.type === "gap-up");
}

/**
 * Get gap-down events only.
 */
export function gapDowns(gaps: readonly Gap[]): Gap[] {
  return gaps.filter((g) => g.type === "gap-down");
}

/**
 * Calculate the gap fill rate (% of gaps that get filled same day).
 */
export function gapFillRate(gaps: readonly Gap[]): number {
  if (gaps.length === 0) return 0;
  const filled = gaps.filter((g) => g.filled).length;
  return filled / gaps.length;
}

/**
 * Get the largest gaps by percentage.
 */
export function largestGaps(gaps: readonly Gap[], count = 5): Gap[] {
  return [...gaps].sort((a, b) => b.gapPercent - a.gapPercent).slice(0, count);
}

/**
 * Get average gap size as percentage.
 */
export function averageGapSize(gaps: readonly Gap[]): number {
  if (gaps.length === 0) return 0;
  const sum = gaps.reduce((s, g) => s + g.gapPercent, 0);
  return sum / gaps.length;
}

/**
 * Detect if a gap occurred on the most recent day.
 */
export function hasRecentGap(data: readonly DayData[], minGapPercent = 0.5): Gap | null {
  if (data.length < 2) return null;
  const gaps = detectGaps(data.slice(-2), minGapPercent);
  return gaps.length > 0 ? gaps[0]! : null;
}
