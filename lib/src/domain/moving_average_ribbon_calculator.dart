/// Moving Average Ribbon Calculator — pure domain logic.
///
/// Computes multiple EMA/SMA series at different periods to create
/// a "ribbon" visualization. The ribbon's width and order indicate
/// trend strength and direction.
library;

import 'package:equatable/equatable.dart';

import 'ema_calculator.dart';
import 'entities.dart';

/// A single point in the MA ribbon.
class RibbonPoint extends Equatable {
  const RibbonPoint({required this.date, required this.values});

  final DateTime date;

  /// EMA values keyed by period, e.g. {10: 102.3, 20: 101.5, ...}.
  final Map<int, double> values;

  /// Whether all shorter-period MAs are above all longer-period MAs
  /// (bullish alignment).
  bool get isBullish {
    final List<MapEntry<int, double>> sorted = values.entries.toList()
      ..sort(
        (MapEntry<int, double> a, MapEntry<int, double> b) =>
            a.key.compareTo(b.key),
      );
    for (int i = 1; i < sorted.length; i++) {
      if (sorted[i - 1].value < sorted[i].value) return false;
    }
    return sorted.length > 1;
  }

  /// Whether all shorter-period MAs are below all longer-period MAs.
  bool get isBearish {
    final List<MapEntry<int, double>> sorted = values.entries.toList()
      ..sort(
        (MapEntry<int, double> a, MapEntry<int, double> b) =>
            a.key.compareTo(b.key),
      );
    for (int i = 1; i < sorted.length; i++) {
      if (sorted[i - 1].value > sorted[i].value) return false;
    }
    return sorted.length > 1;
  }

  @override
  List<Object?> get props => [date, values];
}

/// Computes a multi-period EMA ribbon.
class MovingAverageRibbonCalculator {
  const MovingAverageRibbonCalculator({
    EmaCalculator emaCalculator = const EmaCalculator(),
  }) : _ema = emaCalculator;

  final EmaCalculator _ema;

  /// Default ribbon periods.
  static const List<int> defaultPeriods = [10, 20, 30, 50, 100, 200];

  /// Compute the EMA ribbon series.
  ///
  /// Returns a list of [RibbonPoint]s aligned by date. Only dates
  /// where all periods have a computed value are included.
  List<RibbonPoint> compute(
    List<DailyCandle> candles, {
    List<int> periods = defaultPeriods,
  }) {
    if (candles.isEmpty || periods.isEmpty) return const [];

    // Compute each EMA series.
    final Map<int, Map<DateTime, double>> allSeries = {};
    for (final int period in periods) {
      final List<(DateTime, double?)> series = _ema.computeSeries(
        candles,
        period: period,
      );
      final Map<DateTime, double> map = {};
      for (final (DateTime dt, double? v) in series) {
        if (v != null) map[dt] = v;
      }
      allSeries[period] = map;
    }

    // Intersect dates where all periods are present.
    Set<DateTime>? commonDates;
    for (final Map<DateTime, double> map in allSeries.values) {
      if (commonDates == null) {
        commonDates = map.keys.toSet();
      } else {
        commonDates = commonDates.intersection(map.keys.toSet());
      }
    }

    if (commonDates == null || commonDates.isEmpty) return const [];

    final List<DateTime> sortedDates = commonDates.toList()..sort();

    return [
      for (final DateTime date in sortedDates)
        RibbonPoint(
          date: date,
          values: {
            for (final int period in periods) period: allSeries[period]![date]!,
          },
        ),
    ];
  }
}
