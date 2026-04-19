/// Williams %R — Pure domain logic.
///
/// Williams %R = (highest_high − close) / (highest_high − lowest_low) × −100
/// Oscillates between 0 and −100. Values above −20 are overbought;
/// below −80 are oversold.
library;

import 'entities.dart';
import 'technical_defaults.dart';

/// Computes Williams %R for [DailyCandle] data.
class WilliamsPercentRCalculator {
  const WilliamsPercentRCalculator();

  /// Compute the most recent Williams %R value.
  ///
  /// Returns null when fewer than [period] candles are available.
  double? compute(
    List<DailyCandle> candles, {
    int period = TechnicalDefaults.defaultPeriod,
  }) {
    final series = computeSeries(candles, period: period);
    for (int i = series.length - 1; i >= 0; i--) {
      if (series[i].$2 != null) return series[i].$2;
    }
    return null;
  }

  /// Compute a rolling Williams %R series aligned with [candles].
  ///
  /// The first [period − 1] entries have null values.
  List<(DateTime, double?)> computeSeries(
    List<DailyCandle> candles, {
    int period = TechnicalDefaults.defaultPeriod,
  }) {
    if (candles.length < period) {
      return candles.map((DailyCandle c) => (c.date, null as double?)).toList();
    }

    final result = <(DateTime, double?)>[];

    // Null for warmup entries
    for (int i = 0; i < period - 1; i++) {
      result.add((candles[i].date, null));
    }

    for (int i = period - 1; i < candles.length; i++) {
      double highestHigh = candles[i].high;
      double lowestLow = candles[i].low;
      for (int j = i - period + 1; j < i; j++) {
        if (candles[j].high > highestHigh) highestHigh = candles[j].high;
        if (candles[j].low < lowestLow) lowestLow = candles[j].low;
      }
      final double range = highestHigh - lowestLow;
      final double wr = range > 0
          ? (highestHigh - candles[i].close) / range * -100
          : -50;
      result.add((candles[i].date, wr));
    }
    return result;
  }
}
