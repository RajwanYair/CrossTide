/// Relative Rotation Graph Calculator — computes JdK RS-Ratio and
/// RS-Momentum for plotting securities on a Relative Rotation Graph.
library;

import 'package:equatable/equatable.dart';

/// A single RRG data point for one ticker.
class RrgDataPoint extends Equatable {
  const RrgDataPoint({
    required this.ticker,
    required this.rsRatio,
    required this.rsMomentum,
    required this.quadrant,
  });

  final String ticker;

  /// Relative Strength Ratio (normalized around 100).
  final double rsRatio;

  /// Relative Strength Momentum (normalized around 100).
  final double rsMomentum;

  /// Quadrant: leading, weakening, lagging, improving.
  final RrgQuadrant quadrant;

  @override
  List<Object?> get props => [ticker, rsRatio, rsMomentum, quadrant];
}

/// RRG quadrants based on RS-Ratio vs RS-Momentum.
enum RrgQuadrant { leading, weakening, lagging, improving }

/// Result of RRG calculation for a set of tickers.
class RrgResult extends Equatable {
  const RrgResult({required this.dataPoints, required this.benchmarkTicker});

  final List<RrgDataPoint> dataPoints;
  final String benchmarkTicker;

  /// Tickers in the "Leading" quadrant.
  List<RrgDataPoint> get leading => dataPoints
      .where((RrgDataPoint p) => p.quadrant == RrgQuadrant.leading)
      .toList();

  /// Tickers in the "Improving" quadrant.
  List<RrgDataPoint> get improving => dataPoints
      .where((RrgDataPoint p) => p.quadrant == RrgQuadrant.improving)
      .toList();

  @override
  List<Object?> get props => [dataPoints, benchmarkTicker];
}

/// Computes Relative Rotation Graph coordinates.
class RrgCalculator {
  const RrgCalculator({this.lookback = 12, this.smoothingPeriod = 10});

  /// Number of periods for RS calculation.
  final int lookback;

  /// Smoothing period for the ratio and momentum.
  final int smoothingPeriod;

  /// Compute RRG data points.
  ///
  /// [tickerReturns] maps ticker → list of periodic returns (most recent last).
  /// [benchmarkReturns] is the benchmark's return series.
  RrgResult compute({
    required Map<String, List<double>> tickerReturns,
    required List<double> benchmarkReturns,
    required String benchmarkTicker,
  }) {
    if (benchmarkReturns.isEmpty) {
      return RrgResult(dataPoints: const [], benchmarkTicker: benchmarkTicker);
    }

    final dataPoints = <RrgDataPoint>[];

    for (final MapEntry<String, List<double>> entry in tickerReturns.entries) {
      final returns = entry.value;
      if (returns.length < lookback || benchmarkReturns.length < lookback) {
        continue;
      }

      // Compute relative strength ratios
      final rsRatios = <double>[];
      final minLen = returns.length < benchmarkReturns.length
          ? returns.length
          : benchmarkReturns.length;

      for (int i = 0; i < minLen; i++) {
        final benchReturn = benchmarkReturns[i];
        if (benchReturn == 0) {
          rsRatios.add(100);
        } else {
          rsRatios.add((1 + returns[i]) / (1 + benchReturn) * 100);
        }
      }

      // Smooth the RS-Ratio
      final smoothedRatio = _smooth(rsRatios);
      if (smoothedRatio.isEmpty) continue;

      // RS-Momentum = rate of change of smoothed ratio
      final smoothedMomentum = <double>[];
      for (int i = 1; i < smoothedRatio.length; i++) {
        final prev = smoothedRatio[i - 1];
        if (prev == 0) {
          smoothedMomentum.add(100);
        } else {
          smoothedMomentum.add(smoothedRatio[i] / prev * 100);
        }
      }

      if (smoothedMomentum.isEmpty) continue;

      final rsRatio = smoothedRatio.last;
      final rsMomentum = smoothedMomentum.last;

      final quadrant = _classifyQuadrant(rsRatio, rsMomentum);

      dataPoints.add(
        RrgDataPoint(
          ticker: entry.key,
          rsRatio: rsRatio,
          rsMomentum: rsMomentum,
          quadrant: quadrant,
        ),
      );
    }

    return RrgResult(dataPoints: dataPoints, benchmarkTicker: benchmarkTicker);
  }

  List<double> _smooth(List<double> values) {
    if (values.length < smoothingPeriod) return values;
    final result = <double>[];
    for (int i = smoothingPeriod - 1; i < values.length; i++) {
      var sum = 0.0;
      for (int j = i - smoothingPeriod + 1; j <= i; j++) {
        sum += values[j];
      }
      result.add(sum / smoothingPeriod);
    }
    return result;
  }

  RrgQuadrant _classifyQuadrant(double ratio, double momentum) {
    if (ratio >= 100 && momentum >= 100) return RrgQuadrant.leading;
    if (ratio >= 100 && momentum < 100) return RrgQuadrant.weakening;
    if (ratio < 100 && momentum < 100) return RrgQuadrant.lagging;
    return RrgQuadrant.improving;
  }
}
