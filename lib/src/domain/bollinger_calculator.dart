/// Bollinger Bands Calculator — Pure domain logic.
///
/// Computes Bollinger Bands (20-period SMA ± K * stddev, default K = 2).
///   Middle  = SMA(period)
///   Upper   = Middle + K * stddev(period)
///   Lower   = Middle - K * stddev(period)
library;

import 'dart:math' show sqrt;

import 'entities.dart';

class BollingerResult {
  const BollingerResult({
    required this.date,
    required this.middle,
    required this.upper,
    required this.lower,
    required this.bandwidth,
    required this.percentB,
  });

  final DateTime date;
  final double? middle;
  final double? upper;
  final double? lower;

  /// (upper - lower) / middle — volatility measure.
  final double? bandwidth;

  /// (close - lower) / (upper - lower) — 0..1 position within bands.
  final double? percentB;
}

class BollingerCalculator {
  const BollingerCalculator({this.period = 20, this.multiplier = 2.0});

  final int period;
  final double multiplier;

  /// Compute the full Bollinger Bands series.
  List<BollingerResult> computeSeries(List<DailyCandle> candles) {
    final result = <BollingerResult>[];
    for (int i = 0; i < candles.length; i++) {
      if (i < period - 1) {
        result.add(
          BollingerResult(
            date: candles[i].date,
            middle: null,
            upper: null,
            lower: null,
            bandwidth: null,
            percentB: null,
          ),
        );
        continue;
      }
      final slice = candles.sublist(i - period + 1, i + 1);
      final mean = slice.fold<double>(0.0, (a, c) => a + c.close) / period;
      final variance =
          slice.fold<double>(
            0.0,
            (a, c) => a + (c.close - mean) * (c.close - mean),
          ) /
          period;
      final sd = sqrt(variance);
      final upper = mean + multiplier * sd;
      final lower = mean - multiplier * sd;
      final close = candles[i].close;
      final bw = mean > 0 ? (upper - lower) / mean : null;
      final pb = (upper - lower) > 0 ? (close - lower) / (upper - lower) : null;
      result.add(
        BollingerResult(
          date: candles[i].date,
          middle: mean,
          upper: upper,
          lower: lower,
          bandwidth: bw,
          percentB: pb,
        ),
      );
    }
    return result;
  }

  /// Convenience: return the latest complete Bollinger result (or null).
  BollingerResult? compute(List<DailyCandle> candles) {
    final series = computeSeries(candles);
    for (int i = series.length - 1; i >= 0; i--) {
      if (series[i].upper != null) return series[i];
    }
    return null;
  }
}
