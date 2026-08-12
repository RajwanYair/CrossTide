/** Validate OHLCV quality before prices reach calculations or views. */
import type { DailyCandle } from "../types/domain";

export interface OhlcvQualityIssue {
  readonly code:
    | "invalid-value"
    | "invalid-range"
    | "duplicate-date"
    | "out-of-order"
    | "gap"
    | "currency-mismatch"
    | "invalid-split"
    | "invalid-dividend";
  readonly date?: string;
  readonly message: string;
}

export interface OhlcvQualityOptions {
  readonly expectedCurrency?: string;
  readonly currency?: string;
  readonly maxTradingGapDays?: number;
}

export interface OhlcvQualityReport {
  readonly valid: boolean;
  readonly issues: readonly OhlcvQualityIssue[];
  readonly splitDates: readonly string[];
  readonly dividendDates: readonly string[];
}

export function validateOhlcv(
  candles: readonly DailyCandle[],
  options: OhlcvQualityOptions = {},
): OhlcvQualityReport {
  const issues: OhlcvQualityIssue[] = [];
  const seen = new Set<string>();
  const splitDates: string[] = [];
  const dividendDates: string[] = [];
  const maxTradingGapDays = options.maxTradingGapDays ?? 3;

  if (
    options.expectedCurrency &&
    options.currency &&
    options.expectedCurrency.toUpperCase() !== options.currency.toUpperCase()
  ) {
    issues.push({
      code: "currency-mismatch",
      message: `Expected ${options.expectedCurrency}, received ${options.currency}`,
    });
  }

  for (let index = 0; index < candles.length; index += 1) {
    const candle = candles[index]!;
    const values = [candle.open, candle.high, candle.low, candle.close, candle.volume];
    if (!values.every(Number.isFinite) || candle.volume < 0) {
      issues.push({
        code: "invalid-value",
        date: candle.date,
        message: "OHLCV values must be finite and volume non-negative",
      });
    }
    if (
      candle.low < 0 ||
      candle.high < candle.low ||
      candle.open < candle.low ||
      candle.open > candle.high ||
      candle.close < candle.low ||
      candle.close > candle.high
    ) {
      issues.push({
        code: "invalid-range",
        date: candle.date,
        message: "OHLC values must lie within a non-negative high/low range",
      });
    }
    if (seen.has(candle.date))
      issues.push({ code: "duplicate-date", date: candle.date, message: "Duplicate candle date" });
    seen.add(candle.date);
    const previous = candles[index - 1];
    if (previous) {
      if (candle.date < previous.date)
        issues.push({
          code: "out-of-order",
          date: candle.date,
          message: "Candle dates must be ascending",
        });
      const gapDays = calendarDaysBetween(previous.date, candle.date);
      if (gapDays > maxTradingGapDays)
        issues.push({
          code: "gap",
          date: candle.date,
          message: `Candle series has a ${gapDays}-day calendar gap`,
        });
    }
    if ("splitFactor" in candle && typeof candle.splitFactor === "number") {
      splitDates.push(candle.date);
      if (!Number.isFinite(candle.splitFactor) || candle.splitFactor <= 0) {
        issues.push({
          code: "invalid-split",
          date: candle.date,
          message: "Split factor must be finite and greater than zero",
        });
      }
    }
    if ("dividendAmount" in candle && typeof candle.dividendAmount === "number") {
      dividendDates.push(candle.date);
      if (!Number.isFinite(candle.dividendAmount) || candle.dividendAmount < 0) {
        issues.push({
          code: "invalid-dividend",
          date: candle.date,
          message: "Dividend amount must be finite and non-negative",
        });
      }
    }
  }

  return { valid: issues.length === 0, issues, splitDates, dividendDates };
}

function calendarDaysBetween(first: string, second: string): number {
  const firstTime = Date.parse(`${first}T00:00:00Z`);
  const secondTime = Date.parse(`${second}T00:00:00Z`);
  if (!Number.isFinite(firstTime) || !Number.isFinite(secondTime)) return 0;
  return Math.floor((secondTime - firstTime) / 86_400_000);
}
