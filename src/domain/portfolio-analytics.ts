/**
 * Portfolio aggregations: holdings → sector allocation, position
 * weights, top-N concentration, and unrealized P/L roll-up.
 */

export interface Holding {
  readonly ticker: string;
  readonly sector?: string;
  readonly quantity: number;
  readonly avgCost: number;
  readonly currentPrice: number;
}

export interface SectorAllocation {
  readonly sector: string;
  readonly value: number;
  readonly weight: number;
  readonly tickers: number;
}

export interface PositionMetric {
  readonly ticker: string;
  readonly value: number;
  readonly weight: number;
  readonly unrealizedPnl: number;
  readonly unrealizedReturnPct: number;
}

const UNCATEGORIZED = "Uncategorized";

export function positionValue(h: Holding): number {
  return h.quantity * h.currentPrice;
}

export function unrealizedPnl(h: Holding): number {
  return h.quantity * (h.currentPrice - h.avgCost);
}

export function totalValue(holdings: readonly Holding[]): number {
  let s = 0;
  for (const h of holdings) s += positionValue(h);
  return s;
}

export function sectorAllocation(
  holdings: readonly Holding[],
): SectorAllocation[] {
  const total = totalValue(holdings);
  if (total === 0) return [];
  const map = new Map<string, { value: number; tickers: number }>();
  for (const h of holdings) {
    const sec = h.sector ?? UNCATEGORIZED;
    const cur = map.get(sec) ?? { value: 0, tickers: 0 };
    cur.value += positionValue(h);
    cur.tickers += 1;
    map.set(sec, cur);
  }
  const out: SectorAllocation[] = [];
  for (const [sector, info] of map) {
    out.push({
      sector,
      value: info.value,
      weight: info.value / total,
      tickers: info.tickers,
    });
  }
  return out.sort((a, b) => b.value - a.value);
}

export function positionMetrics(
  holdings: readonly Holding[],
): PositionMetric[] {
  const total = totalValue(holdings);
  return holdings.map((h) => {
    const value = positionValue(h);
    const cost = h.quantity * h.avgCost;
    return {
      ticker: h.ticker,
      value,
      weight: total === 0 ? 0 : value / total,
      unrealizedPnl: unrealizedPnl(h),
      unrealizedReturnPct: cost === 0 ? 0 : (value - cost) / cost,
    };
  });
}

/** Concentration of the top-N holdings as a fraction of portfolio value. */
export function topConcentration(
  holdings: readonly Holding[],
  n: number,
): number {
  if (n <= 0 || holdings.length === 0) return 0;
  const total = totalValue(holdings);
  if (total === 0) return 0;
  const sorted = holdings
    .map(positionValue)
    .sort((a, b) => b - a)
    .slice(0, n);
  let s = 0;
  for (const v of sorted) s += v;
  return s / total;
}
