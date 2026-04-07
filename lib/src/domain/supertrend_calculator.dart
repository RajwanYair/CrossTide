/// SuperTrend — Pure domain logic.
///
/// SuperTrend uses ATR to determine trend direction:
///   Upper Band = (high + low) / 2 + multiplier × ATR
///   Lower Band = (high + low) / 2 − multiplier × ATR
/// Default: 10-period ATR, 3× multiplier.
library;

import 'package:equatable/equatable.dart';

import 'atr_calculator.dart';
import 'entities.dart';

/// A single SuperTrend data point.
class SuperTrendResult extends Equatable {
  const SuperTrendResult({
    required this.date,
    required this.superTrend,
    required this.isUpTrend,
  });

  final DateTime date;

  /// The SuperTrend value (support in uptrend, resistance in downtrend).
  final double superTrend;

  /// True when price is above the SuperTrend (bullish).
  final bool isUpTrend;

  @override
  List<Object?> get props => [date, superTrend, isUpTrend];
}

/// Computes the SuperTrend indicator for [DailyCandle] data.
class SuperTrendCalculator {
  const SuperTrendCalculator({
    this.atrPeriod = 10,
    this.multiplier = 3.0,
    this.atrCalculator = const AtrCalculator(),
  });

  final int atrPeriod;
  final double multiplier;
  final AtrCalculator atrCalculator;

  /// Compute the most recent SuperTrend value.
  SuperTrendResult? compute(List<DailyCandle> candles) {
    final series = computeSeries(candles);
    return series.isEmpty ? null : series.last;
  }

  /// Compute a full SuperTrend series.
  ///
  /// Starts at the same index as ATR (after [atrPeriod] warmup bars).
  List<SuperTrendResult> computeSeries(List<DailyCandle> candles) {
    final atrSeries = atrCalculator.computeSeries(candles, period: atrPeriod);
    if (atrSeries.isEmpty) return [];

    // Map ATR values by date
    final Map<DateTime, double> atrMap = {};
    for (final AtrResult a in atrSeries) {
      atrMap[a.date] = a.atr;
    }

    final List<SuperTrendResult> results = [];
    double prevUpperBand = double.infinity;
    double prevLowerBand = -double.infinity;
    double prevSuperTrend = 0;
    bool prevIsUp = true;
    bool initialized = false;

    for (int i = atrPeriod; i < candles.length; i++) {
      final DailyCandle c = candles[i];
      final double? atr = atrMap[c.date];
      if (atr == null) continue;

      final double mid = (c.high + c.low) / 2;
      double upperBand = mid + multiplier * atr;
      double lowerBand = mid - multiplier * atr;

      if (!initialized) {
        prevUpperBand = upperBand;
        prevLowerBand = lowerBand;
        prevIsUp = c.close > upperBand ? false : true;
        prevSuperTrend = prevIsUp ? lowerBand : upperBand;
        initialized = true;
        results.add(
          SuperTrendResult(
            date: c.date,
            superTrend: prevSuperTrend,
            isUpTrend: prevIsUp,
          ),
        );
        continue;
      }

      // Apply band clamping rules
      if (lowerBand > prevLowerBand || candles[i - 1].close < prevLowerBand) {
        // keep lowerBand
      } else {
        lowerBand = prevLowerBand;
      }

      if (upperBand < prevUpperBand || candles[i - 1].close > prevUpperBand) {
        // keep upperBand
      } else {
        upperBand = prevUpperBand;
      }

      bool isUp;
      double st;
      if (prevIsUp) {
        if (c.close < lowerBand) {
          isUp = false;
          st = upperBand;
        } else {
          isUp = true;
          st = lowerBand;
        }
      } else {
        if (c.close > upperBand) {
          isUp = true;
          st = lowerBand;
        } else {
          isUp = false;
          st = upperBand;
        }
      }

      results.add(
        SuperTrendResult(date: c.date, superTrend: st, isUpTrend: isUp),
      );

      prevUpperBand = upperBand;
      prevLowerBand = lowerBand;
      prevSuperTrend = st;
      prevIsUp = isUp;
    }
    return results;
  }
}
