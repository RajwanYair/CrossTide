/**
 * Volume profile (price-by-volume): bins each candle's volume across
 * its high-low range and aggregates per price bin. Returns POC (point
 * of control) and value area (VA) bounds covering `valueAreaPct` of
 * total volume.
 */

import type { Candle } from "./heikin-ashi";

export interface VolumeProfileBin {
  readonly priceLow: number;
  readonly priceHigh: number;
  readonly volume: number;
}

export interface VolumeProfile {
  readonly bins: readonly VolumeProfileBin[];
  readonly poc: number;
  readonly valueAreaLow: number;
  readonly valueAreaHigh: number;
  readonly totalVolume: number;
}

export interface VolumeProfileOptions {
  readonly bins?: number;
  readonly valueAreaPct?: number;
}

export function computeVolumeProfile(
  candles: readonly Candle[],
  options: VolumeProfileOptions = {},
): VolumeProfile {
  const binCount = options.bins ?? 24;
  const vaPct = options.valueAreaPct ?? 0.7;
  if (candles.length === 0 || binCount <= 0) {
    return { bins: [], poc: 0, valueAreaLow: 0, valueAreaHigh: 0, totalVolume: 0 };
  }

  let lo = Infinity;
  let hi = -Infinity;
  for (const c of candles) {
    if (c.low < lo) lo = c.low;
    if (c.high > hi) hi = c.high;
  }
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi <= lo) {
    return { bins: [], poc: lo, valueAreaLow: lo, valueAreaHigh: hi, totalVolume: 0 };
  }

  const step = (hi - lo) / binCount;
  const buckets = new Array<number>(binCount).fill(0);
  for (const c of candles) {
    const v = c.volume ?? 0;
    if (v <= 0) continue;
    const range = c.high - c.low;
    if (range <= 0) {
      const idx = Math.min(binCount - 1, Math.floor((c.close - lo) / step));
      buckets[idx] = (buckets[idx] ?? 0) + v;
      continue;
    }
    const startBin = Math.max(0, Math.floor((c.low - lo) / step));
    const endBin = Math.min(binCount - 1, Math.floor((c.high - lo) / step));
    const span = endBin - startBin + 1;
    const perBin = v / span;
    for (let i = startBin; i <= endBin; i++) {
      buckets[i] = (buckets[i] ?? 0) + perBin;
    }
  }

  const bins: VolumeProfileBin[] = buckets.map((volume, i) => ({
    priceLow: lo + step * i,
    priceHigh: lo + step * (i + 1),
    volume,
  }));

  let pocIdx = 0;
  for (let i = 1; i < bins.length; i++) {
    if (bins[i]!.volume > bins[pocIdx]!.volume) pocIdx = i;
  }
  const totalVolume = buckets.reduce((s, v) => s + v, 0);
  const target = totalVolume * vaPct;

  let lower = pocIdx;
  let upper = pocIdx;
  let captured = bins[pocIdx]!.volume;
  while (captured < target && (lower > 0 || upper < bins.length - 1)) {
    const below = lower > 0 ? bins[lower - 1]!.volume : -1;
    const above = upper < bins.length - 1 ? bins[upper + 1]!.volume : -1;
    if (above >= below) {
      upper++;
      captured += bins[upper]!.volume;
    } else {
      lower--;
      captured += bins[lower]!.volume;
    }
  }

  const pocBin = bins[pocIdx]!;
  return {
    bins,
    poc: (pocBin.priceLow + pocBin.priceHigh) / 2,
    valueAreaLow: bins[lower]!.priceLow,
    valueAreaHigh: bins[upper]!.priceHigh,
    totalVolume,
  };
}
