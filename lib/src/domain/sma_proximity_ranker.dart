/// SMA Proximity Ranker — pure domain utility.
///
/// Ranks tickers by their percentage distance from a given SMA period.
/// Used for dashboard "tickers near SMA" and screening.
library;

import 'package:equatable/equatable.dart';

import 'entities.dart';
import 'sma_calculator.dart';

/// A ticker with its computed SMA proximity.
class SmaProximity extends Equatable {
  const SmaProximity({
    required this.symbol,
    required this.lastClose,
    required this.smaValue,
    required this.distancePct,
  });

  /// Ticker symbol.
  final String symbol;

  /// Most recent closing price.
  final double lastClose;

  /// The SMA value at the most recent date.
  final double smaValue;

  /// Percentage distance: `(close - sma) / sma × 100`.
  final double distancePct;

  /// Whether the price is above the SMA.
  bool get isAbove => distancePct > 0;

  /// Whether the price is within [thresholdPct]% of the SMA.
  bool isNear({double thresholdPct = 2.0}) => distancePct.abs() <= thresholdPct;

  @override
  List<Object?> get props => [symbol, lastClose, smaValue, distancePct];
}

/// Computes SMA proximity for tickers and ranks them.
class SmaProximityRanker {
  const SmaProximityRanker({SmaCalculator? smaCalculator})
    : _sma = smaCalculator ?? const SmaCalculator();

  final SmaCalculator _sma;

  /// Compute the SMA proximity for a single ticker.
  ///
  /// Returns `null` if there are insufficient candles for the SMA [period].
  SmaProximity? compute({
    required String symbol,
    required List<DailyCandle> candles,
    int period = 200,
  }) {
    if (candles.isEmpty) return null;
    final double? smaValue = _sma.compute(candles, period: period);
    if (smaValue == null || smaValue == 0) return null;
    final double close = candles.last.close;
    return SmaProximity(
      symbol: symbol,
      lastClose: close,
      smaValue: smaValue,
      distancePct: (close - smaValue) / smaValue * 100,
    );
  }

  /// Compute proximity for multiple tickers and rank by absolute distance
  /// (closest to SMA first).
  List<SmaProximity> rankByProximity(
    Map<String, List<DailyCandle>> tickerCandles, {
    int period = 200,
  }) {
    final List<SmaProximity> results = [];
    for (final MapEntry<String, List<DailyCandle>> entry
        in tickerCandles.entries) {
      final SmaProximity? prox = compute(
        symbol: entry.key,
        candles: entry.value,
        period: period,
      );
      if (prox != null) results.add(prox);
    }
    results.sort(
      (SmaProximity a, SmaProximity b) =>
          a.distancePct.abs().compareTo(b.distancePct.abs()),
    );
    return results;
  }
}
