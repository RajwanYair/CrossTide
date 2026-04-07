/// Z-Score Calculator — computes the z-score (standard deviations from mean)
/// of price or indicator values for mean-reversion strategies.
library;

import 'dart:math' as math;

import 'package:equatable/equatable.dart';

/// Z-score result for a single value.
class ZScoreResult extends Equatable {
  const ZScoreResult({
    required this.value,
    required this.mean,
    required this.stdDev,
    required this.zScore,
    required this.percentile,
  });

  final double value;
  final double mean;
  final double stdDev;
  final double zScore;

  /// Approximate percentile (0–100) based on normal distribution.
  final double percentile;

  /// Whether the z-score indicates an extreme reading (|z| > 2).
  bool get isExtreme => zScore.abs() > 2;

  @override
  List<Object?> get props => [value, mean, stdDev, zScore, percentile];
}

/// Rolling z-score series point.
class RollingZScore extends Equatable {
  const RollingZScore({required this.index, required this.zScore});

  final int index;
  final double zScore;

  @override
  List<Object?> get props => [index, zScore];
}

/// Computes z-scores of numeric series.
class ZScoreCalculator {
  const ZScoreCalculator();

  /// Compute the z-score of the latest value in a series.
  ZScoreResult? compute(List<double> values) {
    if (values.length < 2) return null;

    final mean =
        values.fold(0.0, (double a, double b) => a + b) / values.length;
    var sumSqDiff = 0.0;
    for (final double v in values) {
      sumSqDiff += (v - mean) * (v - mean);
    }
    final stdDev = math.sqrt(sumSqDiff / values.length);

    if (stdDev == 0) {
      return ZScoreResult(
        value: values.last,
        mean: mean,
        stdDev: 0,
        zScore: 0,
        percentile: 50,
      );
    }

    final z = (values.last - mean) / stdDev;
    return ZScoreResult(
      value: values.last,
      mean: mean,
      stdDev: stdDev,
      zScore: z,
      percentile: _normalCdf(z) * 100,
    );
  }

  /// Compute a rolling z-score series.
  List<RollingZScore> rolling({
    required List<double> values,
    required int window,
  }) {
    if (values.length < window || window < 2) return [];

    final results = <RollingZScore>[];

    for (int i = window - 1; i < values.length; i++) {
      final slice = values.sublist(i - window + 1, i + 1);
      final mean = slice.fold(0.0, (double a, double b) => a + b) / window;
      var sumSq = 0.0;
      for (final double v in slice) {
        sumSq += (v - mean) * (v - mean);
      }
      final stdDev = math.sqrt(sumSq / window);
      final z = stdDev > 0 ? (values[i] - mean) / stdDev : 0.0;

      results.add(RollingZScore(index: i, zScore: z));
    }

    return results;
  }

  /// Approximate normal CDF using rational approximation.
  double _normalCdf(double z) {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    final sign = z < 0 ? -1.0 : 1.0;
    final x = z.abs() / math.sqrt(2);
    final t = 1.0 / (1.0 + p * x);
    final y =
        1.0 -
        (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * math.exp(-x * x);

    return 0.5 * (1.0 + sign * y);
  }
}
