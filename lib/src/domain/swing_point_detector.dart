/// Swing Point Detector — identifies swing highs and swing lows in candle
/// data for support/resistance and pivot analysis.
library;

import 'package:equatable/equatable.dart';

import 'entities.dart';

/// Type of swing point.
enum SwingPointType { high, low }

/// A detected swing point.
class SwingPoint extends Equatable {
  const SwingPoint({
    required this.type,
    required this.date,
    required this.price,
    required this.index,
    required this.strength,
  });

  final SwingPointType type;
  final DateTime date;
  final double price;

  /// Index in the candle series.
  final int index;

  /// How many bars confirmed this swing (higher = stronger).
  final int strength;

  @override
  List<Object?> get props => [type, date, price, index, strength];
}

/// Result of swing point detection.
class SwingPointResult extends Equatable {
  const SwingPointResult({
    required this.swingHighs,
    required this.swingLows,
    required this.currentTrend,
  });

  final List<SwingPoint> swingHighs;
  final List<SwingPoint> swingLows;

  /// Inferred trend: 'up' if higher highs + higher lows, 'down' otherwise.
  final String currentTrend;

  @override
  List<Object?> get props => [swingHighs, swingLows, currentTrend];
}

/// Detects swing highs and lows.
class SwingPointDetector {
  const SwingPointDetector({this.lookback = 5});

  /// Number of bars on each side to confirm a swing.
  final int lookback;

  /// Detect swing points in the candle series.
  SwingPointResult detect(List<DailyCandle> candles) {
    if (candles.length < lookback * 2 + 1) {
      return const SwingPointResult(
        swingHighs: [],
        swingLows: [],
        currentTrend: 'unknown',
      );
    }

    final highs = <SwingPoint>[];
    final lows = <SwingPoint>[];

    for (int i = lookback; i < candles.length - lookback; i++) {
      var isHigh = true;
      var isLow = true;
      var strength = 0;

      for (int j = 1; j <= lookback; j++) {
        if (candles[i].high <= candles[i - j].high ||
            candles[i].high <= candles[i + j].high) {
          isHigh = false;
        } else {
          strength++;
        }

        if (candles[i].low >= candles[i - j].low ||
            candles[i].low >= candles[i + j].low) {
          isLow = false;
        } else {
          strength++;
        }
      }

      if (isHigh) {
        highs.add(
          SwingPoint(
            type: SwingPointType.high,
            date: candles[i].date,
            price: candles[i].high,
            index: i,
            strength: strength,
          ),
        );
      }

      if (isLow) {
        lows.add(
          SwingPoint(
            type: SwingPointType.low,
            date: candles[i].date,
            price: candles[i].low,
            index: i,
            strength: strength,
          ),
        );
      }
    }

    final trend = _inferTrend(highs, lows);

    return SwingPointResult(
      swingHighs: highs,
      swingLows: lows,
      currentTrend: trend,
    );
  }

  String _inferTrend(List<SwingPoint> highs, List<SwingPoint> lows) {
    if (highs.length < 2 || lows.length < 2) return 'unknown';

    final lastHigh = highs.last;
    final prevHigh = highs[highs.length - 2];
    final lastLow = lows.last;
    final prevLow = lows[lows.length - 2];

    final higherHigh = lastHigh.price > prevHigh.price;
    final higherLow = lastLow.price > prevLow.price;

    if (higherHigh && higherLow) return 'up';
    if (!higherHigh && !higherLow) return 'down';
    return 'sideways';
  }
}
