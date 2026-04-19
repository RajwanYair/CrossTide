/// MFI (Money Flow Index) — Pure domain logic.
///
/// Volume-weighted RSI. Uses typical price × volume to derive
/// positive/negative money flow, then applies the RSI formula.
/// MFI = 100 − 100 / (1 + Money Ratio)
/// Default period: 14.
library;

import 'entities.dart';
import 'technical_defaults.dart';

/// Computes the Money Flow Index series for [DailyCandle] data.
class MfiCalculator {
  const MfiCalculator();

  /// Compute the most recent MFI value.
  ///
  /// Returns null when fewer than [period + 1] candles are available.
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

  /// Compute a rolling MFI series aligned with [candles].
  ///
  /// The first [period] entries have null values.
  List<(DateTime, double?)> computeSeries(
    List<DailyCandle> candles, {
    int period = TechnicalDefaults.defaultPeriod,
  }) {
    if (candles.length <= period) {
      return candles.map((DailyCandle c) => (c.date, null as double?)).toList();
    }

    final result = <(DateTime, double?)>[];

    // Compute typical prices and raw money flow
    final List<double> tp = [];
    for (final DailyCandle c in candles) {
      tp.add((c.high + c.low + c.close) / 3);
    }

    // First [period] entries are null (warmup)
    for (int i = 0; i < period; i++) {
      result.add((candles[i].date, null));
    }

    for (int i = period; i < candles.length; i++) {
      double posFlow = 0;
      double negFlow = 0;
      for (int j = i - period + 1; j <= i; j++) {
        final double mf = tp[j] * candles[j].volume;
        if (tp[j] > tp[j - 1]) {
          posFlow += mf;
        } else if (tp[j] < tp[j - 1]) {
          negFlow += mf;
        }
      }
      final double mfi = negFlow > 0
          ? 100 - 100 / (1 + posFlow / negFlow)
          : 100;
      result.add((candles[i].date, mfi));
    }
    return result;
  }
}
