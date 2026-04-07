/// Trailing Stop Calculator — computes trailing stop loss levels.
///
/// Supports two modes:
/// 1. **Percentage-based**: trail by a fixed % below the highest close.
/// 2. **ATR-based**: trail by N × ATR below the highest close.
library;

import 'package:equatable/equatable.dart';

import 'entities.dart';

/// Result of a trailing stop calculation.
class TrailingStopResult extends Equatable {
  const TrailingStopResult({
    required this.ticker,
    required this.highWaterMark,
    required this.stopLevel,
    required this.currentClose,
    required this.isTriggered,
  });

  final String ticker;

  /// Highest close observed during the hold period.
  final double highWaterMark;

  /// Current stop-loss level.
  final double stopLevel;

  /// Most recent close price.
  final double currentClose;

  /// Whether the stop has been triggered (close fell below stop).
  final bool isTriggered;

  /// Distance from current close to stop level as a percentage.
  double get distancePct =>
      stopLevel > 0 ? ((currentClose - stopLevel) / stopLevel) * 100 : 0;

  @override
  List<Object?> get props => [
    ticker,
    highWaterMark,
    stopLevel,
    currentClose,
    isTriggered,
  ];
}

/// Computes trailing stop levels from candle data.
class TrailingStopCalculator {
  const TrailingStopCalculator();

  /// Compute a percentage-based trailing stop.
  ///
  /// [trailPct] is the distance below the high-water-mark (e.g. 5.0 = 5%).
  TrailingStopResult computePercentage({
    required String ticker,
    required List<DailyCandle> candles,
    required double trailPct,
  }) {
    if (candles.isEmpty) {
      return TrailingStopResult(
        ticker: ticker,
        highWaterMark: 0,
        stopLevel: 0,
        currentClose: 0,
        isTriggered: false,
      );
    }

    var hwm = candles.first.close;
    for (final DailyCandle c in candles) {
      if (c.close > hwm) hwm = c.close;
    }

    final stop = hwm * (1 - trailPct / 100);
    final close = candles.last.close;

    return TrailingStopResult(
      ticker: ticker,
      highWaterMark: hwm,
      stopLevel: stop,
      currentClose: close,
      isTriggered: close < stop,
    );
  }

  /// Compute an ATR-based trailing stop.
  ///
  /// [atrMultiplier] scales the ATR (e.g. 2.0 = 2 × ATR below HWM).
  /// [atrValue] is the pre-computed ATR.
  TrailingStopResult computeAtr({
    required String ticker,
    required List<DailyCandle> candles,
    required double atrValue,
    double atrMultiplier = 2.0,
  }) {
    if (candles.isEmpty) {
      return TrailingStopResult(
        ticker: ticker,
        highWaterMark: 0,
        stopLevel: 0,
        currentClose: 0,
        isTriggered: false,
      );
    }

    var hwm = candles.first.close;
    for (final DailyCandle c in candles) {
      if (c.close > hwm) hwm = c.close;
    }

    final stop = hwm - (atrValue * atrMultiplier);
    final close = candles.last.close;

    return TrailingStopResult(
      ticker: ticker,
      highWaterMark: hwm,
      stopLevel: stop,
      currentClose: close,
      isTriggered: close < stop,
    );
  }
}
