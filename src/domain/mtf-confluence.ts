/**
 * Multi-Timeframe Confluence — evaluates signals across daily, weekly,
 * and monthly timeframes, producing a unified confluence score.
 *
 * When all timeframes align (e.g., all bullish), the confluence score
 * is strong. When they diverge, the score weakens. This helps filter
 * false signals that appear on a single timeframe.
 *
 * @module domain/mtf-confluence
 */

import type { DailyCandle } from "../types/domain";

export interface MtfSignal {
  readonly timeframe: "daily" | "weekly" | "monthly";
  readonly trend: "bullish" | "bearish" | "neutral";
  readonly strength: number; // 0-100
  readonly maAlignment: boolean;
}

export interface MtfConfluenceResult {
  readonly signals: readonly MtfSignal[];
  readonly confluenceScore: number; // -100 (all bearish) to +100 (all bullish)
  readonly direction: "bullish" | "bearish" | "neutral";
  readonly aligned: boolean; // true if all timeframes agree on direction
}

export interface MtfConfluenceOptions {
  /** Short MA period. Default 10. */
  readonly shortMa?: number;
  /** Long MA period. Default 50. */
  readonly longMa?: number;
  /** RSI period for trend strength. Default 14. */
  readonly rsiPeriod?: number;
}

/**
 * Compute multi-timeframe confluence from daily candle data.
 *
 * Internally resamples daily candles to weekly and monthly, then
 * evaluates trend direction and strength on each timeframe via
 * MA alignment and RSI.
 *
 * Requires at least 252 daily candles (1 year) for meaningful monthly signals.
 */
export function computeMtfConfluence(
  candles: readonly DailyCandle[],
  options?: MtfConfluenceOptions,
): MtfConfluenceResult | null {
  const shortPeriod = options?.shortMa ?? 10;
  const longPeriod = options?.longMa ?? 50;
  const rsiPeriod = options?.rsiPeriod ?? 14;

  if (candles.length < longPeriod + rsiPeriod) return null;
  if (shortPeriod < 2 || longPeriod <= shortPeriod || rsiPeriod < 2) return null;

  const weekly = resampleToWeekly(candles);
  const monthly = resampleToMonthly(candles);

  // Scale periods for coarser timeframes: daily uses full, weekly/monthly use shorter
  const weeklyShort = Math.max(2, Math.round(shortPeriod / 5));
  const weeklyLong = Math.max(3, Math.round(longPeriod / 5));
  const monthlyShort = Math.max(2, Math.round(shortPeriod / 20));
  const monthlyLong = Math.max(3, Math.round(longPeriod / 20));
  const weeklyRsi = Math.max(2, Math.round(rsiPeriod / 5));
  const monthlyRsi = Math.max(2, Math.round(rsiPeriod / 5));

  if (weekly.length < weeklyLong + weeklyRsi) return null;
  if (monthly.length < monthlyLong + monthlyRsi) return null;

  const dailySignal = evaluateTimeframe(candles, "daily", shortPeriod, longPeriod, rsiPeriod);
  const weeklySignal = evaluateTimeframe(weekly, "weekly", weeklyShort, weeklyLong, weeklyRsi);
  const monthlySignal = evaluateTimeframe(
    monthly,
    "monthly",
    monthlyShort,
    monthlyLong,
    monthlyRsi,
  );

  const signals = [dailySignal, weeklySignal, monthlySignal] as const;

  // Weighted confluence: monthly 50%, weekly 30%, daily 20%
  const weights = [0.2, 0.3, 0.5]; // daily, weekly, monthly
  let score = 0;

  for (let i = 0; i < signals.length; i++) {
    const s = signals[i]!;
    const w = weights[i]!;
    const direction = s.trend === "bullish" ? 1 : s.trend === "bearish" ? -1 : 0;
    score += direction * s.strength * w;
  }

  // Normalize to -100..+100
  const confluenceScore = Math.round(Math.max(-100, Math.min(100, score)));

  const allBullish = signals.every((s) => s.trend === "bullish");
  const allBearish = signals.every((s) => s.trend === "bearish");

  return {
    signals,
    confluenceScore,
    direction: confluenceScore > 10 ? "bullish" : confluenceScore < -10 ? "bearish" : "neutral",
    aligned: allBullish || allBearish,
  };
}

function evaluateTimeframe(
  candles: readonly DailyCandle[],
  timeframe: "daily" | "weekly" | "monthly",
  shortPeriod: number,
  longPeriod: number,
  rsiPeriod: number,
): MtfSignal {
  const closes = candles.map((c) => c.close);
  const len = closes.length;

  // Compute SMAs
  const shortMa = sma(closes, shortPeriod);
  const longMa = sma(closes, longPeriod);
  const maAlignment = shortMa > longMa;

  // Compute RSI for strength
  const rsi = computeRsi(closes, rsiPeriod);

  // Determine trend
  const lastClose = closes[len - 1]!;
  const aboveShort = lastClose > shortMa;
  const aboveLong = lastClose > longMa;

  let trend: "bullish" | "bearish" | "neutral";
  if (aboveShort && aboveLong && maAlignment) {
    trend = "bullish";
  } else if (!aboveShort && !aboveLong && !maAlignment) {
    trend = "bearish";
  } else {
    trend = "neutral";
  }

  // Strength based on RSI distance from 50
  const strength = Math.min(100, Math.round(Math.abs(rsi - 50) * 2));

  return { timeframe, trend, strength, maAlignment };
}

function sma(values: readonly number[], period: number): number {
  const start = values.length - period;
  let sum = 0;
  for (let i = start; i < values.length; i++) {
    sum += values[i]!;
  }
  return sum / period;
}

function computeRsi(closes: readonly number[], period: number): number {
  if (closes.length < period + 1) return 50;

  let avgGain = 0;
  let avgLoss = 0;

  for (let i = closes.length - period; i < closes.length; i++) {
    const change = closes[i]! - closes[i - 1]!;
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }

  avgGain /= period;
  avgLoss /= period;

  if (avgLoss === 0) return 100;
  if (avgGain === 0) return 0;

  return 100 - 100 / (1 + avgGain / avgLoss);
}

function resampleToWeekly(candles: readonly DailyCandle[]): DailyCandle[] {
  return resample(candles, isSameWeek);
}

function resampleToMonthly(candles: readonly DailyCandle[]): DailyCandle[] {
  return resample(candles, isSameMonth);
}

function resample(
  candles: readonly DailyCandle[],
  samePeriod: (a: string, b: string) => boolean,
): DailyCandle[] {
  if (candles.length === 0) return [];

  const result: DailyCandle[] = [];
  let periodOpen = candles[0]!.open;
  let periodHigh = candles[0]!.high;
  let periodLow = candles[0]!.low;
  let periodVolume = candles[0]!.volume;
  let periodDate = candles[0]!.date;

  for (let i = 1; i < candles.length; i++) {
    const c = candles[i]!;

    if (samePeriod(periodDate, c.date)) {
      periodHigh = Math.max(periodHigh, c.high);
      periodLow = Math.min(periodLow, c.low);
      periodVolume += c.volume;
    } else {
      result.push({
        date: candles[i - 1]!.date,
        open: periodOpen,
        high: periodHigh,
        low: periodLow,
        close: candles[i - 1]!.close,
        volume: periodVolume,
      });
      periodOpen = c.open;
      periodHigh = c.high;
      periodLow = c.low;
      periodVolume = c.volume;
      periodDate = c.date;
    }
  }

  // Last period
  result.push({
    date: candles[candles.length - 1]!.date,
    open: periodOpen,
    high: periodHigh,
    low: periodLow,
    close: candles[candles.length - 1]!.close,
    volume: periodVolume,
  });

  return result;
}

function isSameWeek(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  // Same ISO week: same year and same week number
  return getIsoWeek(da) === getIsoWeek(db) && da.getFullYear() === db.getFullYear();
}

function isSameMonth(a: string, b: string): boolean {
  return a.slice(0, 7) === b.slice(0, 7);
}

function getIsoWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
