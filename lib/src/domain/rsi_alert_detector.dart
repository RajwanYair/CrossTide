/// RSI Alert Detector — Pure domain logic.
///
/// Detects RSI threshold crossings:
///   - oversoldExit: RSI[t-1] < 30 AND RSI[t] >= 30 (potential bullish reversal)
///   - overboughtExit: RSI[t-1] > 70 AND RSI[t] <= 70 (potential bearish reversal)
library;

import 'package:equatable/equatable.dart';

import 'entities.dart';
import 'rsi_calculator.dart';

/// Type of RSI threshold crossing.
enum RsiAlertType {
  /// RSI exited oversold territory (crossed up through 30).
  oversoldExit,

  /// RSI exited overbought territory (crossed down through 70).
  overboughtExit,
}

/// A detected RSI threshold crossing event.
class RsiAlert extends Equatable {
  const RsiAlert({
    required this.symbol,
    required this.date,
    required this.alertType,
    required this.rsiValue,
  });

  final String symbol;
  final DateTime date;
  final RsiAlertType alertType;

  /// RSI value at the crossing candle.
  final double rsiValue;

  @override
  List<Object?> get props => [symbol, date, alertType, rsiValue];
}

/// Scans a candle series for RSI threshold crossings.
class RsiAlertDetector {
  const RsiAlertDetector({
    this.rsiCalculator = const RsiCalculator(),
    this.oversoldThreshold = 30.0,
    this.overboughtThreshold = 70.0,
  });

  final RsiCalculator rsiCalculator;

  /// RSI level defining oversold territory (default 30).
  final double oversoldThreshold;

  /// RSI level defining overbought territory (default 70).
  final double overboughtThreshold;

  /// Returns the most recent RSI crossing, or null if none detected.
  RsiAlert? detect(
    String symbol,
    List<DailyCandle> candles, {
    int period = 14,
  }) {
    final all = detectAll(symbol, candles, period: period);
    return all.isEmpty ? null : all.last;
  }

  /// Returns all RSI threshold crossings in [candles], sorted chronologically.
  List<RsiAlert> detectAll(
    String symbol,
    List<DailyCandle> candles, {
    int period = 14,
  }) {
    final series = rsiCalculator.computeSeries(candles, period: period);
    final alerts = <RsiAlert>[];

    for (var i = 1; i < series.length; i++) {
      final prev = series[i - 1].$2;
      final curr = series[i].$2;
      if (prev == null || curr == null) continue;

      final date = series[i].$1;

      if (prev < oversoldThreshold && curr >= oversoldThreshold) {
        // Oversold exit: RSI crossed up through threshold
        alerts.add(
          RsiAlert(
            symbol: symbol,
            date: date,
            alertType: RsiAlertType.oversoldExit,
            rsiValue: curr,
          ),
        );
      } else if (prev > overboughtThreshold && curr <= overboughtThreshold) {
        // Overbought exit: RSI crossed down through threshold
        alerts.add(
          RsiAlert(
            symbol: symbol,
            date: date,
            alertType: RsiAlertType.overboughtExit,
            rsiValue: curr,
          ),
        );
      }
    }

    return alerts;
  }
}
