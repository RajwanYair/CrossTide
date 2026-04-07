/// Heikin-Ashi — Pure domain logic.
///
/// Transforms standard OHLC candles into Heikin-Ashi representation:
///   HA_Close = (open + high + low + close) / 4
///   HA_Open  = (prev_HA_Open + prev_HA_Close) / 2  (seed: (open+close)/2)
///   HA_High  = max(high, HA_Open, HA_Close)
///   HA_Low   = min(low, HA_Open, HA_Close)
library;

import 'entities.dart';

/// Transforms [DailyCandle] data into Heikin-Ashi candles.
class HeikinAshiCalculator {
  const HeikinAshiCalculator();

  /// Compute the most recent Heikin-Ashi candle.
  DailyCandle? compute(List<DailyCandle> candles) {
    final series = computeSeries(candles);
    return series.isEmpty ? null : series.last;
  }

  /// Compute a full Heikin-Ashi series.
  ///
  /// Returns an empty list when [candles] is empty.
  List<DailyCandle> computeSeries(List<DailyCandle> candles) {
    if (candles.isEmpty) return [];

    final List<DailyCandle> results = [];

    // Seed
    final DailyCandle first = candles[0];
    double haOpen = (first.open + first.close) / 2;
    double haClose = (first.open + first.high + first.low + first.close) / 4;
    double haHigh = [
      first.high,
      haOpen,
      haClose,
    ].reduce((a, b) => a > b ? a : b);
    double haLow = [first.low, haOpen, haClose].reduce((a, b) => a < b ? a : b);

    results.add(
      DailyCandle(
        date: first.date,
        open: haOpen,
        high: haHigh,
        low: haLow,
        close: haClose,
        volume: first.volume,
      ),
    );

    for (int i = 1; i < candles.length; i++) {
      final DailyCandle c = candles[i];
      final double prevOpen = haOpen;
      final double prevClose = haClose;

      haClose = (c.open + c.high + c.low + c.close) / 4;
      haOpen = (prevOpen + prevClose) / 2;
      haHigh = [c.high, haOpen, haClose].reduce((a, b) => a > b ? a : b);
      haLow = [c.low, haOpen, haClose].reduce((a, b) => a < b ? a : b);

      results.add(
        DailyCandle(
          date: c.date,
          open: haOpen,
          high: haHigh,
          low: haLow,
          close: haClose,
          volume: c.volume,
        ),
      );
    }
    return results;
  }
}
