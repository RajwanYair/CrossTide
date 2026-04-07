/// Trend Strength Scorer — pure domain logic.
///
/// Combines ADX, price-vs-MA slope, and MA alignment into a single
/// 0–100 trend-strength score.
library;

import 'adx_calculator.dart';
import 'ema_calculator.dart';
import 'entities.dart';
import 'sma_calculator.dart';

/// Overall trend-strength evaluation.
class TrendStrengthScore {
  const TrendStrengthScore({
    required this.score,
    required this.adxComponent,
    required this.slopeComponent,
    required this.alignmentComponent,
    required this.direction,
  });

  /// Composite score 0–100. Higher = stronger trend.
  final double score;

  /// ADX contribution (0–100 range, weighted 40%).
  final double adxComponent;

  /// Price slope contribution (0–100 range, weighted 30%).
  final double slopeComponent;

  /// MA alignment contribution (0 or 100, weighted 30%).
  final double alignmentComponent;

  /// 1 = bullish, -1 = bearish, 0 = neutral.
  final int direction;
}

/// Scores trend strength from 0 (no trend) to 100 (very strong).
class TrendStrengthScorer {
  const TrendStrengthScorer({
    AdxCalculator adxCalculator = const AdxCalculator(),
    SmaCalculator smaCalculator = const SmaCalculator(),
    EmaCalculator emaCalculator = const EmaCalculator(),
  }) : _adx = adxCalculator,
       _sma = smaCalculator,
       _ema = emaCalculator;

  final AdxCalculator _adx;
  final SmaCalculator _sma;
  final EmaCalculator _ema;

  /// Minimum candles needed (ADX default period 14, plus lookback).
  static const int minimumCandles = 50;

  /// Evaluate trend strength.
  ///
  /// Returns null if insufficient data.
  TrendStrengthScore? evaluate(List<DailyCandle> candles) {
    if (candles.length < minimumCandles) return null;

    // --- ADX component (40% weight) ---
    final AdxResult? adxResult = _adx.compute(candles);
    if (adxResult == null) return null;
    final double adxNorm = adxResult.adx.clamp(0, 100);

    // --- Slope component (30% weight) ---
    // Use EMA20 slope over last 10 days
    final List<(DateTime, double?)> emaSeries = _ema.computeSeries(
      candles,
      period: 20,
    );
    final List<double> emaValues = [
      for (final (DateTime, double?) e in emaSeries)
        if (e.$2 != null) e.$2!,
    ];

    if (emaValues.length < 10) return null;

    final double recentEma = emaValues[emaValues.length - 1];
    final double olderEma = emaValues[emaValues.length - 10];
    final double slopePercent = olderEma != 0
        ? ((recentEma - olderEma) / olderEma) * 100
        : 0;
    // Normalize: 5% slope → 100 score
    final double slopeNorm = (slopePercent.abs() / 5.0 * 100).clamp(0, 100);

    // --- Alignment component (30% weight) ---
    // Bullish alignment: EMA20 > SMA50 > SMA200
    // Bearish alignment: EMA20 < SMA50 < SMA200
    final double? sma50 = _sma.compute(candles, period: 50);
    final double? sma200 = _sma.compute(candles, period: 200);

    double alignmentNorm = 0;
    int direction = 0;

    if (sma50 != null && sma200 != null) {
      if (recentEma > sma50 && sma50 > sma200) {
        alignmentNorm = 100;
        direction = 1;
      } else if (recentEma < sma50 && sma50 < sma200) {
        alignmentNorm = 100;
        direction = -1;
      }
    }

    // If no alignment signal, use slope direction
    if (direction == 0) {
      direction = slopePercent > 0 ? 1 : (slopePercent < 0 ? -1 : 0);
    }

    final double composite =
        adxNorm * 0.4 + slopeNorm * 0.3 + alignmentNorm * 0.3;

    return TrendStrengthScore(
      score: composite.clamp(0, 100),
      adxComponent: adxNorm,
      slopeComponent: slopeNorm,
      alignmentComponent: alignmentNorm,
      direction: direction,
    );
  }
}
