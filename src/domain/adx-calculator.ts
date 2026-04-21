/**
 * ADX (Average Directional Index) — Pure domain logic.
 * Ported from Dart: lib/src/domain/adx_calculator.dart
 *
 * Measures trend strength (0-100) using +DI/-DI from smoothed directional movement.
 */
import type { DailyCandle } from "../types/domain";
import { DEFAULTS } from "./technical-defaults";

export interface AdxPoint {
  readonly date: string;
  readonly adx: number;
  readonly plusDi: number;
  readonly minusDi: number;
}

export function computeAdxSeries(
  candles: readonly DailyCandle[],
  period = DEFAULTS.period,
): AdxPoint[] {
  if (candles.length < 2 * period) return [];

  const trList: number[] = [];
  const plusDm: number[] = [];
  const minusDm: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const c = candles[i]!;
    const p = candles[i - 1]!;

    const hl = c.high - c.low;
    const hpc = Math.abs(c.high - p.close);
    const lpc = Math.abs(c.low - p.close);
    trList.push(Math.max(hl, hpc, lpc));

    const upMove = c.high - p.high;
    const downMove = p.low - c.low;
    plusDm.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDm.push(downMove > upMove && downMove > 0 ? downMove : 0);
  }

  // Wilder-smooth TR, +DM, -DM
  let smoothTr = 0;
  let smoothPlusDm = 0;
  let smoothMinusDm = 0;
  for (let i = 0; i < period; i++) {
    smoothTr += trList[i]!;
    smoothPlusDm += plusDm[i]!;
    smoothMinusDm += minusDm[i]!;
  }

  const dxList: number[] = [];
  const pdiList: number[] = [];
  const mdiList: number[] = [];

  let pdi = smoothTr > 0 ? (smoothPlusDm / smoothTr) * 100 : 0;
  let mdi = smoothTr > 0 ? (smoothMinusDm / smoothTr) * 100 : 0;
  let diSum = pdi + mdi;
  dxList.push(diSum > 0 ? (Math.abs(pdi - mdi) / diSum) * 100 : 0);
  pdiList.push(pdi);
  mdiList.push(mdi);

  for (let i = period; i < trList.length; i++) {
    smoothTr = smoothTr - smoothTr / period + trList[i]!;
    smoothPlusDm = smoothPlusDm - smoothPlusDm / period + plusDm[i]!;
    smoothMinusDm = smoothMinusDm - smoothMinusDm / period + minusDm[i]!;

    pdi = smoothTr > 0 ? (smoothPlusDm / smoothTr) * 100 : 0;
    mdi = smoothTr > 0 ? (smoothMinusDm / smoothTr) * 100 : 0;
    pdiList.push(pdi);
    mdiList.push(mdi);

    diSum = pdi + mdi;
    dxList.push(diSum > 0 ? (Math.abs(pdi - mdi) / diSum) * 100 : 0);
  }

  if (dxList.length < period) return [];

  // Smooth DX to get ADX
  let adx = 0;
  for (let i = 0; i < period; i++) adx += dxList[i]!;
  adx /= period;

  const results: AdxPoint[] = [];
  results.push({
    date: candles[2 * period - 1]!.date,
    adx,
    plusDi: pdiList[period - 1]!,
    minusDi: mdiList[period - 1]!,
  });

  for (let i = period; i < dxList.length; i++) {
    adx = (adx * (period - 1) + dxList[i]!) / period;
    results.push({
      date: candles[i + period]!.date,
      adx,
      plusDi: pdiList[i]!,
      minusDi: mdiList[i]!,
    });
  }
  return results;
}

export function computeAdx(
  candles: readonly DailyCandle[],
  period = DEFAULTS.period,
): number | null {
  const series = computeAdxSeries(candles, period);
  const last = series[series.length - 1];
  return last?.adx ?? null;
}
