/// Drawdown Recovery Estimator — estimates the time and return
/// needed to recover from a drawdown based on historical recovery rates.
library;

import 'package:equatable/equatable.dart';

import 'entities.dart';

/// Recovery estimate from a drawdown event.
class RecoveryEstimate extends Equatable {
  const RecoveryEstimate({
    required this.drawdownPct,
    required this.returnNeededPct,
    required this.estimatedDays,
    required this.historicalAvgDays,
    required this.historicalRecoveries,
  });

  /// Depth of the drawdown (negative percentage).
  final double drawdownPct;

  /// Return needed to fully recover (always > |drawdownPct|).
  final double returnNeededPct;

  /// Estimated trading days to recover based on historical pace.
  final int estimatedDays;

  /// Historical average recovery time in trading days (from similar drawdowns).
  final int historicalAvgDays;

  /// Number of historical recoveries found.
  final int historicalRecoveries;

  @override
  List<Object?> get props => [
    drawdownPct,
    returnNeededPct,
    estimatedDays,
    historicalAvgDays,
    historicalRecoveries,
  ];
}

/// Estimates recovery from drawdowns.
class DrawdownRecoveryEstimator {
  const DrawdownRecoveryEstimator({this.tolerancePct = 5.0});

  /// Drawdown similarity tolerance for historical matching (percentage points).
  final double tolerancePct;

  /// Estimate recovery for the current drawdown.
  ///
  /// [currentDrawdownPct] is the % decline from peak (negative value).
  RecoveryEstimate estimate({
    required String ticker,
    required List<DailyCandle> candles,
    required double currentDrawdownPct,
  }) {
    final returnNeeded = _returnToRecover(currentDrawdownPct);
    final historicalDays = _findHistoricalRecoveries(
      candles,
      currentDrawdownPct,
    );

    final avgDays = historicalDays.isNotEmpty
        ? _mean(historicalDays).round()
        : 0;
    final estimated = historicalDays.isNotEmpty
        ? avgDays
        : _estimateFromReturn(returnNeeded);

    return RecoveryEstimate(
      drawdownPct: currentDrawdownPct,
      returnNeededPct: returnNeeded,
      estimatedDays: estimated,
      historicalAvgDays: avgDays,
      historicalRecoveries: historicalDays.length,
    );
  }

  /// The return needed to recover from a drawdown.
  /// A 50% loss requires a 100% gain: return = 1/(1 + dd/100) − 1.
  double _returnToRecover(double drawdownPct) {
    final fraction = drawdownPct.abs() / 100;
    if (fraction >= 1) return double.infinity;
    return (1 / (1 - fraction) - 1) * 100;
  }

  /// Find historical drawdown→recovery episodes of similar depth.
  List<int> _findHistoricalRecoveries(
    List<DailyCandle> candles,
    double targetDd,
  ) {
    if (candles.length < 3) return [];

    final recoveries = <int>[];
    var peak = candles.first.close;
    var inDrawdown = false;
    var drawdownStart = 0;

    for (int i = 1; i < candles.length; i++) {
      final close = candles[i].close;

      if (close > peak) {
        if (inDrawdown) {
          // Recovered — record the duration
          recoveries.add(i - drawdownStart);
          inDrawdown = false;
        }
        peak = close;
      } else {
        final dd = ((close - peak) / peak) * 100;
        if (!inDrawdown && (dd - targetDd).abs() <= tolerancePct) {
          inDrawdown = true;
          drawdownStart = i;
        }
      }
    }

    return recoveries;
  }

  /// Crude estimate: ~1 trading day per 0.1% return needed.
  int _estimateFromReturn(double returnNeeded) {
    if (returnNeeded.isInfinite) return 9999;
    return (returnNeeded * 10).round().clamp(1, 9999);
  }

  double _mean(List<int> values) {
    var sum = 0;
    for (final int v in values) {
      sum += v;
    }
    return sum / values.length;
  }
}
