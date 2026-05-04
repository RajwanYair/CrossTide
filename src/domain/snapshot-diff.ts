/**
 * Data snapshot diffing — compare two point-in-time ticker data snapshots
 * to highlight what changed (price, volume, signal flips).
 */

export interface TickerData {
  readonly ticker: string;
  readonly price: number;
  readonly change: number;
  readonly volume: number;
  readonly signal?: string;
}

export interface SnapshotDiff {
  readonly ticker: string;
  readonly priceDelta: number;
  readonly priceDeltaPercent: number;
  readonly volumeDelta: number;
  readonly signalChanged: boolean;
  readonly oldSignal?: string;
  readonly newSignal?: string;
}

export interface DiffSummary {
  readonly totalTickers: number;
  readonly priceIncreased: number;
  readonly priceDecreased: number;
  readonly unchanged: number;
  readonly signalFlips: number;
  readonly avgPriceChange: number;
}

/**
 * Compute diffs between two snapshots (before and after).
 */
export function diffSnapshots(
  before: readonly TickerData[],
  after: readonly TickerData[],
): SnapshotDiff[] {
  const beforeMap = new Map(before.map((t) => [t.ticker.toUpperCase(), t]));
  const diffs: SnapshotDiff[] = [];

  for (const current of after) {
    const key = current.ticker.toUpperCase();
    const prev = beforeMap.get(key);
    if (!prev) continue;

    const priceDelta = current.price - prev.price;
    const priceDeltaPercent = prev.price !== 0 ? (priceDelta / prev.price) * 100 : 0;
    const signalChanged = prev.signal !== current.signal;

    diffs.push({
      ticker: key,
      priceDelta,
      priceDeltaPercent,
      volumeDelta: current.volume - prev.volume,
      signalChanged,
      ...(signalChanged && prev.signal !== undefined && { oldSignal: prev.signal }),
      ...(signalChanged && current.signal !== undefined && { newSignal: current.signal }),
    });
  }

  return diffs;
}

/**
 * Get a summary of the diff.
 */
export function summarizeDiff(diffs: readonly SnapshotDiff[]): DiffSummary {
  let priceIncreased = 0;
  let priceDecreased = 0;
  let unchanged = 0;
  let signalFlips = 0;
  let totalChange = 0;

  for (const d of diffs) {
    if (d.priceDelta > 0) priceIncreased++;
    else if (d.priceDelta < 0) priceDecreased++;
    else unchanged++;
    if (d.signalChanged) signalFlips++;
    totalChange += d.priceDeltaPercent;
  }

  return {
    totalTickers: diffs.length,
    priceIncreased,
    priceDecreased,
    unchanged,
    signalFlips,
    avgPriceChange: diffs.length > 0 ? totalChange / diffs.length : 0,
  };
}

/**
 * Filter diffs to only significant movers (above threshold %).
 */
export function getSignificantMovers(
  diffs: readonly SnapshotDiff[],
  thresholdPercent: number,
): SnapshotDiff[] {
  return diffs.filter((d) => Math.abs(d.priceDeltaPercent) >= thresholdPercent);
}

/**
 * Get diffs sorted by absolute price change descending.
 */
export function sortByLargestMove(diffs: readonly SnapshotDiff[]): SnapshotDiff[] {
  return [...diffs].sort((a, b) => Math.abs(b.priceDeltaPercent) - Math.abs(a.priceDeltaPercent));
}

/**
 * Get only signal flip diffs.
 */
export function getSignalFlips(diffs: readonly SnapshotDiff[]): SnapshotDiff[] {
  return diffs.filter((d) => d.signalChanged);
}
