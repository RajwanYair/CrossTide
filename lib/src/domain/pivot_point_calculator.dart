/// Pivot Points — Pure domain logic.
///
/// Classic pivot point calculation from prior-day OHLC:
///   Pivot = (high + low + close) / 3
///   R1 = 2 × Pivot − low;   S1 = 2 × Pivot − high
///   R2 = Pivot + (high − low); S2 = Pivot − (high − low)
///   R3 = high + 2 × (Pivot − low); S3 = low − 2 × (high − Pivot)
library;

import 'package:equatable/equatable.dart';

import 'entities.dart';

/// A complete set of pivot levels for a single day.
class PivotResult extends Equatable {
  const PivotResult({
    required this.date,
    required this.pivot,
    required this.r1,
    required this.r2,
    required this.r3,
    required this.s1,
    required this.s2,
    required this.s3,
  });

  final DateTime date;
  final double pivot;
  final double r1;
  final double r2;
  final double r3;
  final double s1;
  final double s2;
  final double s3;

  @override
  List<Object?> get props => [date, pivot, r1, r2, r3, s1, s2, s3];
}

/// Computes classic Pivot Points from prior-day candles.
class PivotPointCalculator {
  const PivotPointCalculator();

  /// Compute pivot levels for the most recent candle.
  PivotResult? compute(List<DailyCandle> candles) {
    final series = computeSeries(candles);
    return series.isEmpty ? null : series.last;
  }

  /// Compute pivot levels for each candle based on the prior candle.
  ///
  /// Requires at least 2 candles. The first candle has no prior reference.
  List<PivotResult> computeSeries(List<DailyCandle> candles) {
    if (candles.length < 2) return [];

    final List<PivotResult> results = [];
    for (int i = 1; i < candles.length; i++) {
      final DailyCandle prev = candles[i - 1];
      final double p = (prev.high + prev.low + prev.close) / 3;
      final double range = prev.high - prev.low;

      results.add(
        PivotResult(
          date: candles[i].date,
          pivot: p,
          r1: 2 * p - prev.low,
          r2: p + range,
          r3: prev.high + 2 * (p - prev.low),
          s1: 2 * p - prev.high,
          s2: p - range,
          s3: prev.low - 2 * (prev.high - p),
        ),
      );
    }
    return results;
  }
}
