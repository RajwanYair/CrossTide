/**
 * Price target tracker — set and track price targets per ticker
 * with progress-to-target calculations and hit detection.
 */

export interface PriceTarget {
  readonly ticker: string;
  readonly targetPrice: number;
  readonly entryPrice: number;
  readonly direction: "long" | "short";
  readonly createdAt: number;
  readonly note: string;
}

export interface TargetProgress {
  readonly ticker: string;
  readonly target: PriceTarget;
  readonly currentPrice: number;
  readonly progressPercent: number; // 0-100+, can exceed 100 if past target
  readonly remainingPercent: number;
  readonly hit: boolean;
}

const STORAGE_KEY = "crosstide-price-targets";

let cache: PriceTarget[] | null = null;

function load(): PriceTarget[] {
  if (cache !== null) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as PriceTarget[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function save(targets: PriceTarget[]): void {
  cache = targets;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(targets));
}

/**
 * Add a price target for a ticker.
 */
export function addPriceTarget(
  ticker: string,
  targetPrice: number,
  entryPrice: number,
  direction: "long" | "short" = "long",
  note = "",
): void {
  const targets = load();
  targets.push({
    ticker: ticker.toUpperCase(),
    targetPrice,
    entryPrice,
    direction,
    createdAt: Date.now(),
    note,
  });
  save(targets);
}

/**
 * Get all targets for a ticker.
 */
export function getTargets(ticker: string): readonly PriceTarget[] {
  return load().filter((t) => t.ticker === ticker.toUpperCase());
}

/**
 * Get all targets.
 */
export function getAllTargets(): readonly PriceTarget[] {
  return load();
}

/**
 * Remove a target by ticker and target price.
 */
export function removeTarget(ticker: string, targetPrice: number): boolean {
  const targets = load();
  const idx = targets.findIndex(
    (t) => t.ticker === ticker.toUpperCase() && t.targetPrice === targetPrice,
  );
  if (idx < 0) return false;
  targets.splice(idx, 1);
  save(targets);
  return true;
}

/**
 * Calculate progress toward a target given current price.
 */
export function calculateProgress(target: PriceTarget, currentPrice: number): TargetProgress {
  const totalMove = target.targetPrice - target.entryPrice;
  const actualMove = currentPrice - target.entryPrice;

  let progressPercent: number;
  if (totalMove === 0) {
    progressPercent = 0;
  } else if (target.direction === "long") {
    progressPercent = (actualMove / totalMove) * 100;
  } else {
    progressPercent = (-actualMove / -totalMove) * 100;
  }

  const hit =
    target.direction === "long"
      ? currentPrice >= target.targetPrice
      : currentPrice <= target.targetPrice;

  const remainingPercent =
    target.entryPrice !== 0
      ? Math.abs(((target.targetPrice - currentPrice) / target.entryPrice) * 100)
      : 0;

  return {
    ticker: target.ticker,
    target,
    currentPrice,
    progressPercent,
    remainingPercent,
    hit,
  };
}

/**
 * Check all targets against current prices.
 */
export function checkAllTargets(currentPrices: ReadonlyMap<string, number>): TargetProgress[] {
  const targets = load();
  const results: TargetProgress[] = [];
  for (const target of targets) {
    const price = currentPrices.get(target.ticker);
    if (price !== undefined) {
      results.push(calculateProgress(target, price));
    }
  }
  return results;
}

/**
 * Get targets that have been hit.
 */
export function getHitTargets(progress: readonly TargetProgress[]): TargetProgress[] {
  return progress.filter((p) => p.hit);
}

/**
 * Clear all targets.
 */
export function clearAllTargets(): void {
  cache = [];
  localStorage.removeItem(STORAGE_KEY);
}
