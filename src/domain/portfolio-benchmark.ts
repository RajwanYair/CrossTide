/**
 * Portfolio benchmark comparison — compare portfolio returns against a market index.
 *
 * Computes relative performance metrics (alpha, tracking error, beta proxy)
 * and generates comparison data for visualization.
 */

export interface BenchmarkComparison {
  /** Portfolio total return (%). */
  readonly portfolioReturn: number;
  /** Benchmark total return (%). */
  readonly benchmarkReturn: number;
  /** Excess return = portfolio - benchmark (%). */
  readonly alpha: number;
  /** Whether portfolio outperformed the benchmark. */
  readonly outperformed: boolean;
  /** Benchmark ticker symbol used. */
  readonly benchmarkTicker: string;
}

export interface ReturnSeries {
  readonly date: string;
  readonly portfolioValue: number;
  readonly benchmarkValue: number;
}

/** Supported benchmark indices. */
export const BENCHMARK_OPTIONS = [
  { ticker: "SPY", label: "S&P 500 (SPY)" },
  { ticker: "QQQ", label: "NASDAQ 100 (QQQ)" },
  { ticker: "IWM", label: "Russell 2000 (IWM)" },
  { ticker: "VTI", label: "Total Market (VTI)" },
  { ticker: "AGG", label: "US Bonds (AGG)" },
] as const;

export type BenchmarkTicker = (typeof BENCHMARK_OPTIONS)[number]["ticker"];
export const DEFAULT_BENCHMARK: BenchmarkTicker = "SPY";

/**
 * Compute portfolio vs benchmark return comparison.
 *
 * @param portfolioCostBasis  Total cost basis of the portfolio (at purchase).
 * @param portfolioValue      Current total portfolio value.
 * @param benchmarkStartPrice Benchmark price at portfolio start date.
 * @param benchmarkEndPrice   Benchmark current price.
 * @param benchmarkTicker     Which benchmark was used.
 */
export function computeBenchmarkComparison(
  portfolioCostBasis: number,
  portfolioValue: number,
  benchmarkStartPrice: number,
  benchmarkEndPrice: number,
  benchmarkTicker: BenchmarkTicker = DEFAULT_BENCHMARK,
): BenchmarkComparison {
  const portfolioReturn =
    portfolioCostBasis > 0 ? ((portfolioValue - portfolioCostBasis) / portfolioCostBasis) * 100 : 0;

  const benchmarkReturn =
    benchmarkStartPrice > 0
      ? ((benchmarkEndPrice - benchmarkStartPrice) / benchmarkStartPrice) * 100
      : 0;

  const alpha = portfolioReturn - benchmarkReturn;

  return {
    portfolioReturn,
    benchmarkReturn,
    alpha,
    outperformed: alpha > 0,
    benchmarkTicker,
  };
}

/**
 * Generate a normalized return series for comparison charting.
 * Both series start at baseValue (e.g. 10000) and diverge based on daily returns.
 *
 * @param portfolioDailyReturns Array of daily portfolio return fractions (e.g. 0.01 = +1%).
 * @param benchmarkDailyReturns Array of daily benchmark return fractions.
 * @param dates                 Corresponding dates (ISO strings).
 * @param baseValue             Starting value for normalization (default 10000).
 */
export function buildReturnSeries(
  portfolioDailyReturns: readonly number[],
  benchmarkDailyReturns: readonly number[],
  dates: readonly string[],
  baseValue = 10_000,
): ReturnSeries[] {
  const len = Math.min(portfolioDailyReturns.length, benchmarkDailyReturns.length, dates.length);
  const series: ReturnSeries[] = [];

  let pValue = baseValue;
  let bValue = baseValue;

  for (let i = 0; i < len; i++) {
    pValue *= 1 + portfolioDailyReturns[i]!;
    bValue *= 1 + benchmarkDailyReturns[i]!;
    series.push({
      date: dates[i]!,
      portfolioValue: Math.round(pValue * 100) / 100,
      benchmarkValue: Math.round(bValue * 100) / 100,
    });
  }

  return series;
}
