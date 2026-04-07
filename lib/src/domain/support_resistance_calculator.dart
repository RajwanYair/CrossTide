/// Support & Resistance Calculator — pure domain logic.
///
/// Identifies horizontal support and resistance levels by finding
/// local minima and maxima in the price series. Uses a configurable
/// lookback window (number of candles on each side of the pivot).
library;

import 'package:equatable/equatable.dart';

import 'entities.dart';

/// A detected support or resistance level.
class SupportResistanceLevel extends Equatable {
  const SupportResistanceLevel({
    required this.price,
    required this.date,
    required this.isSupport,
    required this.touchCount,
  });

  final double price;
  final DateTime date;
  final bool isSupport;

  /// Number of times price touched this level (within tolerance).
  final int touchCount;

  @override
  List<Object?> get props => [price, date, isSupport, touchCount];
}

/// Finds support/resistance levels from price pivots.
class SupportResistanceCalculator {
  const SupportResistanceCalculator();

  /// Find support and resistance levels.
  ///
  /// [lookback] is the number of candles on each side that must be
  /// higher (for support) or lower (for resistance) than the pivot.
  /// [tolerancePercent] merges levels within this % of each other.
  List<SupportResistanceLevel> compute(
    List<DailyCandle> candles, {
    int lookback = 5,
    double tolerancePercent = 1.0,
  }) {
    if (candles.length < lookback * 2 + 1) return const [];

    final List<_RawPivot> pivots = [];

    for (int i = lookback; i < candles.length - lookback; i++) {
      bool isLow = true;
      bool isHigh = true;

      for (int j = 1; j <= lookback; j++) {
        if (candles[i].low >= candles[i - j].low ||
            candles[i].low >= candles[i + j].low) {
          isLow = false;
        }
        if (candles[i].high <= candles[i - j].high ||
            candles[i].high <= candles[i + j].high) {
          isHigh = false;
        }
      }

      if (isLow) {
        pivots.add(
          _RawPivot(
            price: candles[i].low,
            date: candles[i].date,
            isSupport: true,
          ),
        );
      }
      if (isHigh) {
        pivots.add(
          _RawPivot(
            price: candles[i].high,
            date: candles[i].date,
            isSupport: false,
          ),
        );
      }
    }

    // Merge close levels
    return _mergeLevels(pivots, tolerancePercent);
  }

  List<SupportResistanceLevel> _mergeLevels(
    List<_RawPivot> pivots,
    double tolerancePercent,
  ) {
    if (pivots.isEmpty) return const [];

    // Sort by price
    final List<_RawPivot> sorted = [...pivots]
      ..sort((_RawPivot a, _RawPivot b) => a.price.compareTo(b.price));

    final List<SupportResistanceLevel> merged = [];
    double groupSum = sorted.first.price;
    int groupCount = 1;
    DateTime groupDate = sorted.first.date;
    bool groupIsSupport = sorted.first.isSupport;

    for (int i = 1; i < sorted.length; i++) {
      final double avg = groupSum / groupCount;
      final double diff = ((sorted[i].price - avg) / avg).abs() * 100;

      if (diff <= tolerancePercent) {
        groupSum += sorted[i].price;
        groupCount++;
        if (sorted[i].date.isAfter(groupDate)) {
          groupDate = sorted[i].date;
        }
      } else {
        merged.add(
          SupportResistanceLevel(
            price: groupSum / groupCount,
            date: groupDate,
            isSupport: groupIsSupport,
            touchCount: groupCount,
          ),
        );
        groupSum = sorted[i].price;
        groupCount = 1;
        groupDate = sorted[i].date;
        groupIsSupport = sorted[i].isSupport;
      }
    }

    merged.add(
      SupportResistanceLevel(
        price: groupSum / groupCount,
        date: groupDate,
        isSupport: groupIsSupport,
        touchCount: groupCount,
      ),
    );

    return merged;
  }
}

class _RawPivot {
  const _RawPivot({
    required this.price,
    required this.date,
    required this.isSupport,
  });

  final double price;
  final DateTime date;
  final bool isSupport;
}
