/// RSI Calculator — Pure domain logic.
///
/// Computes the Relative Strength Index (14-period by default) using
/// Wilder's smoothing (exponential smoothed average of gains/losses).
/// Standard formula:
///   RSI = 100 - 100 / (1 + RS)  where RS = avg_gain / avg_loss
library;

import 'entities.dart';
import 'technical_defaults.dart';

class RsiCalculator {
  const RsiCalculator();

  /// Compute the current RSI for the given [period] (default 14).
  ///
  /// Returns null if fewer than [period + 1] candles are available.
  double? compute(
    List<DailyCandle> candles, {
    int period = TechnicalDefaults.defaultPeriod,
  }) {
    final series = computeSeries(candles, period: period);
    for (int i = series.length - 1; i >= 0; i--) {
      if (series[i].$2 != null) return series[i].$2;
    }
    return null;
  }

  /// Compute a rolling RSI series aligned with [candles].
  ///
  /// The first [period] entries will have null values (warmup).
  List<(DateTime, double?)> computeSeries(
    List<DailyCandle> candles, {
    int period = TechnicalDefaults.defaultPeriod,
  }) {
    if (candles.length <= period) {
      return candles.map((c) => (c.date, null as double?)).toList();
    }

    final result = <(DateTime, double?)>[];
    // Seed with average gain/loss of first [period] price changes
    double sumGain = 0;
    double sumLoss = 0;
    for (int i = 1; i <= period; i++) {
      final change = candles[i].close - candles[i - 1].close;
      if (change >= 0) {
        sumGain += change;
      } else {
        sumLoss -= change; // keep positive
      }
    }
    double avgGain = sumGain / period;
    double avgLoss = sumLoss / period;

    // Nulls for warmup
    for (int i = 0; i < period; i++) {
      result.add((candles[i].date, null));
    }

    // First RSI
    result.add((candles[period].date, _rsi(avgGain, avgLoss)));

    // Rolling Wilder smoothing
    for (int i = period + 1; i < candles.length; i++) {
      final change = candles[i].close - candles[i - 1].close;
      final gain = change > 0 ? change : 0.0;
      final loss = change < 0 ? -change : 0.0;
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
      result.add((candles[i].date, _rsi(avgGain, avgLoss)));
    }

    return result;
  }

  static double _rsi(double avgGain, double avgLoss) {
    if (avgLoss == 0) return 100.0;
    final rs = avgGain / avgLoss;
    return 100.0 - 100.0 / (1.0 + rs);
  }
}
