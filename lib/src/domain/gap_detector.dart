/// Gap Detector — pure domain logic.
///
/// Detects price gaps (up and down) between consecutive candles.
/// A gap-up occurs when today's low > yesterday's high.
/// A gap-down occurs when today's high < yesterday's low.
library;

import 'package:equatable/equatable.dart';

import 'entities.dart';

/// Direction of a price gap.
enum GapDirection { up, down }

/// A detected price gap.
class PriceGap extends Equatable {
  const PriceGap({
    required this.date,
    required this.direction,
    required this.gapPercent,
    required this.gapStart,
    required this.gapEnd,
  });

  /// Date the gap occurred (the later candle's date).
  final DateTime date;

  final GapDirection direction;

  /// Size of the gap as a percentage of the previous close.
  final double gapPercent;

  /// Bottom of gap zone (previous high for gap-up, today's high for gap-down).
  final double gapStart;

  /// Top of gap zone (today's low for gap-up, previous low for gap-down).
  final double gapEnd;

  @override
  List<Object?> get props => [date, direction, gapPercent, gapStart, gapEnd];
}

/// Detects price gaps in a candle series.
class GapDetector {
  const GapDetector();

  /// Find all gaps in [candles] whose absolute size is at least
  /// [minimumPercent]% of the previous close.
  ///
  /// Candles must be sorted chronologically (oldest first).
  List<PriceGap> detect(
    List<DailyCandle> candles, {
    double minimumPercent = 0.0,
  }) {
    if (candles.length < 2) return const [];

    final List<PriceGap> gaps = [];

    for (int i = 1; i < candles.length; i++) {
      final DailyCandle prev = candles[i - 1];
      final DailyCandle curr = candles[i];

      if (prev.close == 0) continue;

      if (curr.low > prev.high) {
        // Gap up
        final double pct = ((curr.low - prev.high) / prev.close) * 100;
        if (pct.abs() >= minimumPercent) {
          gaps.add(
            PriceGap(
              date: curr.date,
              direction: GapDirection.up,
              gapPercent: pct,
              gapStart: prev.high,
              gapEnd: curr.low,
            ),
          );
        }
      } else if (curr.high < prev.low) {
        // Gap down
        final double pct = ((curr.high - prev.low) / prev.close) * 100;
        if (pct.abs() >= minimumPercent) {
          gaps.add(
            PriceGap(
              date: curr.date,
              direction: GapDirection.down,
              gapPercent: pct,
              gapStart: curr.high,
              gapEnd: prev.low,
            ),
          );
        }
      }
    }

    return gaps;
  }
}
