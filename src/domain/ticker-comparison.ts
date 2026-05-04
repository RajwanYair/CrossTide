/**
 * Ticker comparison table — side-by-side data comparison
 * for multiple tickers across various metrics.
 */

export interface TickerMetrics {
  readonly ticker: string;
  readonly price: number;
  readonly changePercent: number;
  readonly volume: number;
  readonly marketCap?: number;
  readonly pe?: number;
  readonly dividendYield?: number;
  readonly week52High?: number;
  readonly week52Low?: number;
}

export interface ComparisonColumn {
  readonly key: keyof TickerMetrics;
  readonly label: string;
}

export interface ComparisonResult {
  readonly columns: readonly ComparisonColumn[];
  readonly rows: readonly TickerMetrics[];
  readonly best: ReadonlyMap<string, string>; // metric key → ticker with best value
  readonly worst: ReadonlyMap<string, string>; // metric key → ticker with worst value
}

const DEFAULT_COLUMNS: ComparisonColumn[] = [
  { key: "price", label: "Price" },
  { key: "changePercent", label: "Change %" },
  { key: "volume", label: "Volume" },
  { key: "marketCap", label: "Market Cap" },
  { key: "pe", label: "P/E" },
  { key: "dividendYield", label: "Div Yield" },
];

/**
 * Build a comparison table for the given tickers.
 */
export function buildComparison(
  data: readonly TickerMetrics[],
  columns: readonly ComparisonColumn[] = DEFAULT_COLUMNS,
): ComparisonResult {
  const best = new Map<string, string>();
  const worst = new Map<string, string>();

  for (const col of columns) {
    let bestVal = -Infinity;
    let worstVal = Infinity;
    let bestTicker = "";
    let worstTicker = "";

    for (const row of data) {
      const val = row[col.key];
      if (typeof val !== "number") continue;
      if (val > bestVal) {
        bestVal = val;
        bestTicker = row.ticker;
      }
      if (val < worstVal) {
        worstVal = val;
        worstTicker = row.ticker;
      }
    }

    if (bestTicker) best.set(col.key, bestTicker);
    if (worstTicker) worst.set(col.key, worstTicker);
  }

  return { columns, rows: data, best, worst };
}

/**
 * Rank tickers by a specific metric (descending).
 */
export function rankByMetric(
  data: readonly TickerMetrics[],
  metric: keyof TickerMetrics,
): readonly TickerMetrics[] {
  return [...data].sort((a, b) => {
    const va = a[metric];
    const vb = b[metric];
    if (typeof va !== "number" || typeof vb !== "number") return 0;
    return vb - va;
  });
}

/**
 * Calculate the percent distance from 52-week high.
 */
export function distanceFrom52WeekHigh(data: TickerMetrics): number | null {
  if (data.week52High == null || data.week52High === 0) return null;
  return ((data.week52High - data.price) / data.week52High) * 100;
}

/**
 * Calculate the percent distance from 52-week low.
 */
export function distanceFrom52WeekLow(data: TickerMetrics): number | null {
  if (data.week52Low == null || data.week52Low === 0) return null;
  return ((data.price - data.week52Low) / data.week52Low) * 100;
}

/**
 * Get the relative performance rank (1 = best) for each ticker.
 */
export function performanceRank(data: readonly TickerMetrics[]): ReadonlyMap<string, number> {
  const sorted = [...data].sort((a, b) => b.changePercent - a.changePercent);
  const ranks = new Map<string, number>();
  sorted.forEach((item, idx) => ranks.set(item.ticker, idx + 1));
  return ranks;
}
