/// Price Distance Calculator — pure domain logic.
///
/// Computes the percentage distance of the latest close from any
/// given SMA, plus a convenience method for computing distances from
/// multiple common SMA periods at once.
library;

import 'package:equatable/equatable.dart';

import 'entities.dart';
import 'sma_calculator.dart';

/// Distance result for a single SMA period.
class PriceDistance extends Equatable {
  const PriceDistance({
    required this.period,
    required this.smaValue,
    required this.closePrice,
    required this.distancePercent,
  });

  final int period;
  final double smaValue;
  final double closePrice;

  /// Positive = above SMA, negative = below SMA.
  final double distancePercent;

  @override
  List<Object?> get props => [period, smaValue, closePrice, distancePercent];
}

/// Computes price distance from various SMAs.
class PriceDistanceCalculator {
  const PriceDistanceCalculator({
    SmaCalculator smaCalculator = const SmaCalculator(),
  }) : _sma = smaCalculator;

  final SmaCalculator _sma;

  /// Compute % distance of the latest close from SMA([period]).
  ///
  /// Returns null if not enough data.
  PriceDistance? compute(List<DailyCandle> candles, {required int period}) {
    if (candles.isEmpty) return null;
    final double? sma = _sma.compute(candles, period: period);
    if (sma == null || sma == 0) return null;

    final double close = candles.last.close;
    final double distance = ((close - sma) / sma) * 100;

    return PriceDistance(
      period: period,
      smaValue: sma,
      closePrice: close,
      distancePercent: distance,
    );
  }

  /// Compute distances from multiple SMA periods at once.
  ///
  /// Returns only periods for which sufficient data exists.
  List<PriceDistance> computeMultiple(
    List<DailyCandle> candles, {
    List<int> periods = const [20, 50, 100, 150, 200],
  }) {
    final List<PriceDistance> results = [];
    for (final int p in periods) {
      final PriceDistance? d = compute(candles, period: p);
      if (d != null) results.add(d);
    }
    return results;
  }
}
