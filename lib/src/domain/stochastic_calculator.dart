/// Stochastic Oscillator — Pure domain logic.
///
/// Computes %K and %D for the Stochastic Oscillator.
/// %K = (close − lowest_low) / (highest_high − lowest_low) × 100
/// %D = SMA(%K, smoothD)
///
/// Default: 14-period lookback, 3-period %K smoothing, 3-period %D smoothing.
library;

import 'package:equatable/equatable.dart';

import 'entities.dart';
import 'technical_defaults.dart';

/// A single data point in the Stochastic series.
class StochasticResult extends Equatable {
  const StochasticResult({
    required this.date,
    required this.percentK,
    required this.percentD,
  });

  final DateTime date;

  /// Fast %K (0–100).
  final double percentK;

  /// Slow %D — SMA of %K (0–100).
  final double percentD;

  @override
  List<Object?> get props => [date, percentK, percentD];
}

/// Computes the Stochastic Oscillator series for [DailyCandle] data.
class StochasticCalculator {
  const StochasticCalculator();

  /// Compute the most recent Stochastic value.
  ///
  /// Returns null when insufficient data.
  StochasticResult? compute(
    List<DailyCandle> candles, {
    int period = TechnicalDefaults.defaultPeriod,
    int smoothK = 3,
    int smoothD = 3,
  }) {
    final series = computeSeries(
      candles,
      period: period,
      smoothK: smoothK,
      smoothD: smoothD,
    );
    return series.isEmpty ? null : series.last;
  }

  /// Compute a full Stochastic series.
  ///
  /// Returns an empty list when data is insufficient.
  List<StochasticResult> computeSeries(
    List<DailyCandle> candles, {
    int period = TechnicalDefaults.defaultPeriod,
    int smoothK = 3,
    int smoothD = 3,
  }) {
    final int minLen = period + smoothK + smoothD - 2;
    if (candles.length < minLen) return [];

    // Step 1: raw %K values
    final List<(DateTime, double)> rawK = [];
    for (int i = period - 1; i < candles.length; i++) {
      double lowestLow = candles[i].low;
      double highestHigh = candles[i].high;
      for (int j = i - period + 1; j < i; j++) {
        if (candles[j].low < lowestLow) lowestLow = candles[j].low;
        if (candles[j].high > highestHigh) highestHigh = candles[j].high;
      }
      final double range = highestHigh - lowestLow;
      final double k = range > 0
          ? (candles[i].close - lowestLow) / range * 100
          : 50;
      rawK.add((candles[i].date, k));
    }

    // Step 2: smooth %K with SMA(smoothK)
    final List<(DateTime, double)> smoothedK = [];
    for (int i = smoothK - 1; i < rawK.length; i++) {
      double sum = 0;
      for (int j = i - smoothK + 1; j <= i; j++) {
        sum += rawK[j].$2;
      }
      smoothedK.add((rawK[i].$1, sum / smoothK));
    }

    // Step 3: %D = SMA(smoothedK, smoothD)
    final List<StochasticResult> results = [];
    for (int i = smoothD - 1; i < smoothedK.length; i++) {
      double sum = 0;
      for (int j = i - smoothD + 1; j <= i; j++) {
        sum += smoothedK[j].$2;
      }
      final double d = sum / smoothD;
      results.add(
        StochasticResult(
          date: smoothedK[i].$1,
          percentK: smoothedK[i].$2,
          percentD: d,
        ),
      );
    }
    return results;
  }
}
