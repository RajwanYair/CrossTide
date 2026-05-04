/**
 * Support/resistance level finder — identify key price levels
 * from historical data using pivot points and price clustering.
 */

export interface PriceLevel {
  readonly price: number;
  readonly type: "support" | "resistance";
  readonly strength: number; // number of touches
  readonly firstSeen: number; // index
  readonly lastSeen: number; // index
}

/**
 * Find local minima (swing lows) in a price series.
 */
export function findSwingLows(
  prices: readonly number[],
  lookback = 5,
): { price: number; index: number }[] {
  const lows: { price: number; index: number }[] = [];

  for (let i = lookback; i < prices.length - lookback; i++) {
    let isLow = true;
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j !== i && prices[j]! <= prices[i]!) {
        isLow = false;
        break;
      }
    }
    if (isLow) lows.push({ price: prices[i]!, index: i });
  }

  return lows;
}

/**
 * Find local maxima (swing highs) in a price series.
 */
export function findSwingHighs(
  prices: readonly number[],
  lookback = 5,
): { price: number; index: number }[] {
  const highs: { price: number; index: number }[] = [];

  for (let i = lookback; i < prices.length - lookback; i++) {
    let isHigh = true;
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j !== i && prices[j]! >= prices[i]!) {
        isHigh = false;
        break;
      }
    }
    if (isHigh) highs.push({ price: prices[i]!, index: i });
  }

  return highs;
}

/**
 * Cluster nearby price levels into zones.
 * Levels within `tolerance` percent are merged.
 */
export function clusterLevels(
  levels: readonly { price: number; index: number }[],
  tolerance = 1,
): { price: number; count: number; firstIndex: number; lastIndex: number }[] {
  if (levels.length === 0) return [];

  const sorted = [...levels].sort((a, b) => a.price - b.price);
  const clusters: { prices: number[]; indices: number[] }[] = [];

  let current = { prices: [sorted[0]!.price], indices: [sorted[0]!.index] };

  for (let i = 1; i < sorted.length; i++) {
    const avg = current.prices.reduce((s, p) => s + p, 0) / current.prices.length;
    const diff = ((sorted[i]!.price - avg) / avg) * 100;

    if (Math.abs(diff) <= tolerance) {
      current.prices.push(sorted[i]!.price);
      current.indices.push(sorted[i]!.index);
    } else {
      clusters.push(current);
      current = { prices: [sorted[i]!.price], indices: [sorted[i]!.index] };
    }
  }
  clusters.push(current);

  return clusters.map((c) => ({
    price: c.prices.reduce((s, p) => s + p, 0) / c.prices.length,
    count: c.prices.length,
    firstIndex: Math.min(...c.indices),
    lastIndex: Math.max(...c.indices),
  }));
}

/**
 * Find support and resistance levels from a price series.
 */
export function findLevels(prices: readonly number[], lookback = 5, tolerance = 1): PriceLevel[] {
  const lows = findSwingLows(prices, lookback);
  const highs = findSwingHighs(prices, lookback);

  const supportClusters = clusterLevels(lows, tolerance);
  const resistanceClusters = clusterLevels(highs, tolerance);

  const levels: PriceLevel[] = [];

  for (const cluster of supportClusters) {
    levels.push({
      price: cluster.price,
      type: "support",
      strength: cluster.count,
      firstSeen: cluster.firstIndex,
      lastSeen: cluster.lastIndex,
    });
  }

  for (const cluster of resistanceClusters) {
    levels.push({
      price: cluster.price,
      type: "resistance",
      strength: cluster.count,
      firstSeen: cluster.firstIndex,
      lastSeen: cluster.lastIndex,
    });
  }

  return levels.sort((a, b) => b.strength - a.strength);
}

/**
 * Get nearest support level below current price.
 */
export function nearestSupport(
  levels: readonly PriceLevel[],
  currentPrice: number,
): PriceLevel | null {
  const supports = levels
    .filter((l) => l.type === "support" && l.price < currentPrice)
    .sort((a, b) => b.price - a.price);
  return supports.length > 0 ? supports[0]! : null;
}

/**
 * Get nearest resistance level above current price.
 */
export function nearestResistance(
  levels: readonly PriceLevel[],
  currentPrice: number,
): PriceLevel | null {
  const resistances = levels
    .filter((l) => l.type === "resistance" && l.price > currentPrice)
    .sort((a, b) => a.price - b.price);
  return resistances.length > 0 ? resistances[0]! : null;
}
