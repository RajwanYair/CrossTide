/// MACD Calculator — Pure domain logic.
///
/// Computes the MACD (Moving Average Convergence Divergence) indicator:
///   MACD Line  = EMA(12) - EMA(26)
///   Signal Line = EMA(9) of MACD Line
///   Histogram  = MACD Line - Signal Line
library;

import 'ema_calculator.dart';
import 'entities.dart';

class MacdResult {
  const MacdResult({
    required this.date,
    required this.macd,
    required this.signal,
    required this.histogram,
  });

  final DateTime date;

  /// MACD line value (null during warmup).
  final double? macd;

  /// Signal line value (null during warmup).
  final double? signal;

  /// Histogram value (null during warmup).
  final double? histogram;
}

class MacdCalculator {
  const MacdCalculator({
    this.fastPeriod = 12,
    this.slowPeriod = 26,
    this.signalPeriod = 9,
  });

  final int fastPeriod;
  final int slowPeriod;
  final int signalPeriod;

  final _ema = const EmaCalculator();

  /// Compute the full MACD + Signal + Histogram series.
  List<MacdResult> computeSeries(List<DailyCandle> candles) {
    final fastSeries = _ema.computeSeries(candles, period: fastPeriod);
    final slowSeries = _ema.computeSeries(candles, period: slowPeriod);

    // Build the MACD line where both fast and slow are available
    final macdValues = <(DateTime, double?)>[];
    for (int i = 0; i < candles.length; i++) {
      final f = fastSeries[i].$2;
      final s = slowSeries[i].$2;
      macdValues.add((
        candles[i].date,
        (f != null && s != null) ? f - s : null,
      ));
    }

    // Extract non-null MACD values to compute Signal EMA via virtual candles
    final macdNonNull = <DailyCandle>[];
    final macdNullCount = macdValues.indexWhere((v) => v.$2 != null);
    if (macdNullCount < 0) {
      return candles
          .map(
            (c) => MacdResult(
              date: c.date,
              macd: null,
              signal: null,
              histogram: null,
            ),
          )
          .toList();
    }
    for (int i = macdNullCount; i < macdValues.length; i++) {
      macdNonNull.add(
        DailyCandle(
          date: macdValues[i].$1,
          open: macdValues[i].$2!,
          high: macdValues[i].$2!,
          low: macdValues[i].$2!,
          close: macdValues[i].$2!,
          volume: 0,
        ),
      );
    }

    final signalSeries = _ema.computeSeries(macdNonNull, period: signalPeriod);

    final result = <MacdResult>[];
    int signalIdx = 0;
    for (int i = 0; i < candles.length; i++) {
      final macdVal = macdValues[i].$2;
      if (macdVal == null || i < macdNullCount) {
        result.add(
          MacdResult(
            date: candles[i].date,
            macd: null,
            signal: null,
            histogram: null,
          ),
        );
        continue;
      }
      final sig = signalSeries[signalIdx].$2;
      result.add(
        MacdResult(
          date: candles[i].date,
          macd: macdVal,
          signal: sig,
          histogram: (sig != null) ? macdVal - sig : null,
        ),
      );
      signalIdx++;
    }
    return result;
  }

  /// Convenience: return the latest complete MACD result (or null).
  MacdResult? compute(List<DailyCandle> candles) {
    final series = computeSeries(candles);
    for (int i = series.length - 1; i >= 0; i--) {
      if (series[i].histogram != null) return series[i];
    }
    return null;
  }
}
