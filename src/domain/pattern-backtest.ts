/**
 * Pattern backtesting engine — historical win-rate validation (I3).
 *
 * Evaluates candlestick pattern detections against subsequent price
 * action to compute win rates, average gains/losses, expectancy, and
 * other statistics.  Works with the pattern-recognition module's
 * `detectAllPatterns` output.
 *
 * Usage:
 *   const candles = loadCandles("AAPL");
 *   const report = backtestPatterns(candles, { holdBars: 5 });
 *   console.log(report.summary);
 */

import type { PatternCandle, DetectedPattern, PatternDirection } from "./pattern-recognition";
import { detectAllPatterns } from "./pattern-recognition";

// ── Types ────────────────────────────────────────────────────────────────

export interface PatternBacktestConfig {
  /** Number of bars to hold after pattern detection. Default 5. */
  readonly holdBars?: number;
  /** Minimum confidence threshold for pattern inclusion. Default 0. */
  readonly minConfidence?: number;
  /** Optional list of pattern names to include (null = all). */
  readonly includePatterns?: readonly string[] | null;
}

export interface PatternTradeResult {
  /** Pattern name (e.g. "Hammer"). */
  readonly pattern: string;
  /** Directional bias of the pattern. */
  readonly direction: PatternDirection;
  /** Confidence score from detection. */
  readonly confidence: number;
  /** Index of the candle where the pattern was detected. */
  readonly entryIndex: number;
  /** Entry price (close of pattern candle). */
  readonly entryPrice: number;
  /** Exit price (close of candle at entryIndex + holdBars). */
  readonly exitPrice: number;
  /** Percentage change from entry to exit. */
  readonly returnPct: number;
  /** Whether the trade was a win (aligned with directional bias). */
  readonly win: boolean;
}

export interface PatternStats {
  readonly pattern: string;
  readonly direction: PatternDirection;
  readonly occurrences: number;
  readonly wins: number;
  readonly losses: number;
  readonly winRate: number;
  readonly avgReturn: number;
  readonly avgWin: number;
  readonly avgLoss: number;
  readonly expectancy: number;
  readonly bestReturn: number;
  readonly worstReturn: number;
}

export interface PatternBacktestReport {
  /** Per-trade results. */
  readonly trades: readonly PatternTradeResult[];
  /** Per-pattern aggregated stats. */
  readonly summary: readonly PatternStats[];
  /** Overall win rate across all patterns. */
  readonly overallWinRate: number;
  /** Overall average return across all trades. */
  readonly overallAvgReturn: number;
  /** Total number of trades evaluated. */
  readonly totalTrades: number;
  /** Configuration used. */
  readonly config: Required<PatternBacktestConfig>;
}

// ── Defaults ─────────────────────────────────────────────────────────────

const DEFAULT_HOLD_BARS = 5;
const DEFAULT_MIN_CONFIDENCE = 0;

// ── Core ─────────────────────────────────────────────────────────────────

/**
 * Evaluate pattern detections against subsequent price action.
 */
export function evaluatePatternTrade(
  candles: readonly PatternCandle[],
  detection: DetectedPattern,
  holdBars: number,
): PatternTradeResult | null {
  const exitIndex = detection.index + holdBars;
  if (exitIndex >= candles.length) return null;

  const entryPrice = candles[detection.index]!.close;
  const exitPrice = candles[exitIndex]!.close;
  if (entryPrice === 0) return null;

  const returnPct = ((exitPrice - entryPrice) / entryPrice) * 100;

  // A bullish pattern "wins" if price went up; bearish if price went down
  const win =
    detection.type === "bullish"
      ? returnPct > 0
      : detection.type === "bearish"
        ? returnPct < 0
        : false; // neutral patterns never "win"

  return {
    pattern: detection.name,
    direction: detection.type,
    confidence: detection.confidence,
    entryIndex: detection.index,
    entryPrice,
    exitPrice,
    returnPct,
    win,
  };
}

/**
 * Aggregate trade results into per-pattern statistics.
 */
export function aggregatePatternStats(trades: readonly PatternTradeResult[]): PatternStats[] {
  const groups = new Map<string, PatternTradeResult[]>();
  for (const t of trades) {
    const key = `${t.pattern}|${t.direction}`;
    const arr = groups.get(key);
    if (arr) arr.push(t);
    else groups.set(key, [t]);
  }

  const stats: PatternStats[] = [];
  for (const [, group] of groups) {
    const first = group[0]!;
    const wins = group.filter((t) => t.win).length;
    const losses = group.length - wins;
    const returns = group.map((t) => t.returnPct);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;

    const winReturns = group.filter((t) => t.win).map((t) => t.returnPct);
    const lossReturns = group.filter((t) => !t.win).map((t) => t.returnPct);

    const avgWin =
      winReturns.length > 0 ? winReturns.reduce((a, b) => a + b, 0) / winReturns.length : 0;
    const avgLoss =
      lossReturns.length > 0 ? lossReturns.reduce((a, b) => a + b, 0) / lossReturns.length : 0;

    const winRate = group.length > 0 ? wins / group.length : 0;
    const expectancy = winRate * avgWin + (1 - winRate) * avgLoss;

    stats.push({
      pattern: first.pattern,
      direction: first.direction,
      occurrences: group.length,
      wins,
      losses,
      winRate,
      avgReturn,
      avgWin,
      avgLoss,
      expectancy,
      bestReturn: Math.max(...returns),
      worstReturn: Math.min(...returns),
    });
  }

  return stats.sort((a, b) => b.winRate - a.winRate);
}

/**
 * Run a full pattern backtest on historical candle data.
 */
export function backtestPatterns(
  candles: readonly PatternCandle[],
  config: PatternBacktestConfig = {},
): PatternBacktestReport {
  const holdBars = config.holdBars ?? DEFAULT_HOLD_BARS;
  const minConfidence = config.minConfidence ?? DEFAULT_MIN_CONFIDENCE;
  const includePatterns = config.includePatterns ?? null;

  const resolvedConfig: Required<PatternBacktestConfig> = {
    holdBars,
    minConfidence,
    includePatterns,
  };

  // Detect all patterns
  let detections = detectAllPatterns(candles);

  // Filter by confidence
  if (minConfidence > 0) {
    detections = detections.filter((d) => d.confidence >= minConfidence);
  }

  // Filter by pattern name
  if (includePatterns) {
    const nameSet = new Set(includePatterns);
    detections = detections.filter((d) => nameSet.has(d.name));
  }

  // Evaluate each detection
  const trades: PatternTradeResult[] = [];
  for (const det of detections) {
    const result = evaluatePatternTrade(candles, det, holdBars);
    if (result) trades.push(result);
  }

  const summary = aggregatePatternStats(trades);

  const totalTrades = trades.length;
  const overallWins = trades.filter((t) => t.win).length;
  const overallWinRate = totalTrades > 0 ? overallWins / totalTrades : 0;
  const overallAvgReturn =
    totalTrades > 0 ? trades.reduce((s, t) => s + t.returnPct, 0) / totalTrades : 0;

  return {
    trades,
    summary,
    overallWinRate,
    overallAvgReturn,
    totalTrades,
    config: resolvedConfig,
  };
}
