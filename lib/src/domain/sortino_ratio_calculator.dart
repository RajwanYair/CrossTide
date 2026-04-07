/// Sortino Ratio Calculator — pure domain logic.
///
/// Like the Sharpe ratio but only penalizes *downside* deviation,
/// making it a better measure of risk-adjusted return for assets
/// with asymmetric return distributions.
library;

import 'dart:math' show sqrt;

import 'entities.dart';

/// Computes the annualized Sortino ratio.
class SortinoRatioCalculator {
  const SortinoRatioCalculator();

  /// Annualized trading days.
  static const int tradingDaysPerYear = 252;

  /// Compute the annualized Sortino ratio from candle closing prices.
  ///
  /// [minimumAcceptableReturn] is annualized (e.g. 0.0 = 0%).
  /// Returns null if [candles] has fewer than 3 entries or if downside
  /// deviation is zero (no negative returns).
  double? compute(
    List<DailyCandle> candles, {
    double minimumAcceptableReturn = 0.0,
  }) {
    if (candles.length < 3) return null;

    final List<double> returns = [];
    for (int i = 1; i < candles.length; i++) {
      final double prev = candles[i - 1].close;
      if (prev == 0) continue;
      returns.add((candles[i].close - prev) / prev);
    }

    if (returns.length < 2) return null;

    final double dailyMAR = minimumAcceptableReturn / tradingDaysPerYear;

    // Mean daily return
    double sum = 0;
    for (final double r in returns) {
      sum += r;
    }
    final double meanReturn = sum / returns.length;

    // Downside deviation (only count returns below MAR)
    double sumSqDownside = 0;
    int downsideCount = 0;
    for (final double r in returns) {
      if (r < dailyMAR) {
        final double diff = r - dailyMAR;
        sumSqDownside += diff * diff;
        downsideCount++;
      }
    }

    if (downsideCount == 0) return null;

    final double downsideDev = sqrt(sumSqDownside / returns.length);
    if (downsideDev == 0) return null;

    final double excessReturn = meanReturn - dailyMAR;
    return (excessReturn / downsideDev) * sqrt(tradingDaysPerYear.toDouble());
  }
}
