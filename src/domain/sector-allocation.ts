/**
 * Sector allocation calculator — compute sector weightings and
 * concentration metrics for a portfolio of holdings.
 */

export interface Holding {
  readonly ticker: string;
  readonly sector: string;
  readonly value: number;
}

export interface SectorAllocation {
  readonly sector: string;
  readonly totalValue: number;
  readonly weight: number; // 0–1
  readonly count: number;
}

export interface AllocationSummary {
  readonly allocations: readonly SectorAllocation[];
  readonly totalValue: number;
  readonly sectorCount: number;
  readonly topSector: string;
  readonly herfindahlIndex: number; // 0–1; higher = more concentrated
}

/**
 * Calculate per-sector allocation from a list of holdings.
 */
export function calculateAllocations(holdings: readonly Holding[]): SectorAllocation[] {
  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
  if (totalValue === 0) return [];

  const sectors = new Map<string, { value: number; count: number }>();
  for (const h of holdings) {
    const existing = sectors.get(h.sector);
    if (existing) {
      existing.value += h.value;
      existing.count += 1;
    } else {
      sectors.set(h.sector, { value: h.value, count: 1 });
    }
  }

  const results: SectorAllocation[] = [];
  for (const [sector, data] of sectors) {
    results.push({
      sector,
      totalValue: data.value,
      weight: data.value / totalValue,
      count: data.count,
    });
  }

  return results.sort((a, b) => b.weight - a.weight);
}

/**
 * Compute Herfindahl-Hirschman Index for concentration.
 * Ranges 0–1: sum of squared weights. Higher = more concentrated.
 */
export function herfindahlIndex(allocations: readonly SectorAllocation[]): number {
  return allocations.reduce((sum, a) => sum + a.weight * a.weight, 0);
}

/**
 * Get full allocation summary for a portfolio.
 */
export function allocationSummary(holdings: readonly Holding[]): AllocationSummary {
  const allocations = calculateAllocations(holdings);
  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
  const topSector = allocations.length > 0 ? allocations[0]!.sector : "";
  const hhi = herfindahlIndex(allocations);

  return {
    allocations,
    totalValue,
    sectorCount: allocations.length,
    topSector,
    herfindahlIndex: hhi,
  };
}

/**
 * Identify sectors that exceed a given weight threshold.
 */
export function overweightSectors(
  allocations: readonly SectorAllocation[],
  threshold = 0.3,
): SectorAllocation[] {
  return allocations.filter((a) => a.weight > threshold);
}

/**
 * Identify sectors below a minimum weight threshold.
 */
export function underweightSectors(
  allocations: readonly SectorAllocation[],
  threshold = 0.05,
): SectorAllocation[] {
  return allocations.filter((a) => a.weight < threshold);
}

/**
 * Calculate ideal equal-weight target and deviation from it.
 */
export function deviationFromEqual(
  allocations: readonly SectorAllocation[],
): ReadonlyMap<string, number> {
  if (allocations.length === 0) return new Map();
  const idealWeight = 1 / allocations.length;
  const result = new Map<string, number>();
  for (const a of allocations) {
    result.set(a.sector, a.weight - idealWeight);
  }
  return result;
}
