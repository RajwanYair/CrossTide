/// Trendline Calculator — computes automatic trendlines from swing points
/// by connecting swing highs (resistance) and swing lows (support).
library;

import 'dart:math' as math;

import 'package:equatable/equatable.dart';

/// A computed trendline defined by two anchor points.
class Trendline extends Equatable {
  const Trendline({
    required this.startIndex,
    required this.startPrice,
    required this.endIndex,
    required this.endPrice,
    required this.slope,
    required this.isSupport,
    required this.touchCount,
  });

  final int startIndex;
  final double startPrice;
  final int endIndex;
  final double endPrice;

  /// Price change per bar.
  final double slope;

  /// True if support (connects lows), false if resistance (connects highs).
  final bool isSupport;

  /// Number of times price touched or came near this line.
  final int touchCount;

  /// Project the price at a future index.
  double priceAt(int index) => startPrice + slope * (index - startIndex);

  @override
  List<Object?> get props => [
    startIndex,
    startPrice,
    endIndex,
    endPrice,
    slope,
    isSupport,
    touchCount,
  ];
}

/// Result of trendline calculation.
class TrendlineResult extends Equatable {
  const TrendlineResult({
    required this.supportLines,
    required this.resistanceLines,
  });

  final List<Trendline> supportLines;
  final List<Trendline> resistanceLines;

  @override
  List<Object?> get props => [supportLines, resistanceLines];
}

/// Computes trendlines from price data (highs and lows).
class TrendlineCalculator {
  const TrendlineCalculator({this.touchTolerance = 0.01, this.minTouches = 2});

  /// Tolerance for counting a "touch" as fraction of price.
  final double touchTolerance;

  /// Minimum touches to qualify as a valid trendline.
  final int minTouches;

  /// Compute trendlines from swing points.
  ///
  /// [highs] — price highs per bar.
  /// [lows] — price lows per bar.
  /// [swingIndices] — indices of swing highs/lows to anchor on.
  TrendlineResult compute({
    required List<double> highs,
    required List<double> lows,
    required List<int> swingHighIndices,
    required List<int> swingLowIndices,
  }) {
    final resistance = _findLines(
      prices: highs,
      indices: swingHighIndices,
      isSupport: false,
    );
    final support = _findLines(
      prices: lows,
      indices: swingLowIndices,
      isSupport: true,
    );

    return TrendlineResult(supportLines: support, resistanceLines: resistance);
  }

  List<Trendline> _findLines({
    required List<double> prices,
    required List<int> indices,
    required bool isSupport,
  }) {
    final lines = <Trendline>[];

    for (int i = 0; i < indices.length; i++) {
      for (int j = i + 1; j < indices.length; j++) {
        final idx1 = indices[i];
        final idx2 = indices[j];
        if (idx1 >= prices.length || idx2 >= prices.length) continue;

        final p1 = prices[idx1];
        final p2 = prices[idx2];
        final span = idx2 - idx1;
        if (span <= 0) continue;

        final slope = (p2 - p1) / span;

        // Count touches
        var touches = 0;
        for (int k = 0; k < prices.length; k++) {
          final projected = p1 + slope * (k - idx1);
          final tolerance = projected * touchTolerance;
          if ((prices[k] - projected).abs() <= math.max(tolerance, 0.01)) {
            touches++;
          }
        }

        if (touches >= minTouches) {
          lines.add(
            Trendline(
              startIndex: idx1,
              startPrice: p1,
              endIndex: idx2,
              endPrice: p2,
              slope: slope,
              isSupport: isSupport,
              touchCount: touches,
            ),
          );
        }
      }
    }

    // Sort by touch count descending
    lines.sort(
      (Trendline a, Trendline b) => b.touchCount.compareTo(a.touchCount),
    );

    return lines;
  }
}
