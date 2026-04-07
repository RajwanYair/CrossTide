/// ATR Calculator — Average True Range domain logic.
///
/// Standard ATR formula (Wilder smoothing, default period 14).
/// True Range = max(high-low, |high-prevClose|, |low-prevClose|)
/// ATR[i] = (ATR[i-1] × (period-1) + TR[i]) / period
library;

import 'package:equatable/equatable.dart';

import 'entities.dart';

/// One data point in the ATR series.
class AtrResult extends Equatable {
  const AtrResult({
    required this.date,
    required this.atr,
    required this.atrPercent,
  });

  /// The candle date this ATR value corresponds to.
  final DateTime date;

  /// Absolute Average True Range (in price units).
  final double atr;

  /// ATR expressed as percentage of that day's closing price.
  /// `atrPercent = (atr / close) * 100`
  final double atrPercent;

  @override
  List<Object?> get props => [date, atr, atrPercent];
}

/// Computes the ATR series for a list of [DailyCandle] values.
class AtrCalculator {
  const AtrCalculator();

  /// Compute the most recent ATR value.
  ///
  /// Returns null when [candles] has fewer than [period + 1] elements.
  AtrResult? compute(List<DailyCandle> candles, {int period = 14}) {
    final series = computeSeries(candles, period: period);
    return series.isEmpty ? null : series.last;
  }

  /// Compute a full ATR series aligned to [candles].
  ///
  /// The first [period] entries are excluded (insufficient warmup data).
  /// Returns an empty list when [candles.length] <= [period].
  List<AtrResult> computeSeries(List<DailyCandle> candles, {int period = 14}) {
    if (candles.length <= period) return [];

    // Seed: average TR of first [period] bars.
    double sumTr = 0;
    for (int i = 1; i <= period; i++) {
      sumTr += _trueRange(candles[i], candles[i - 1].close);
    }
    double atr = sumTr / period;

    final List<AtrResult> results = [];
    // Emit the seed bar before iterating forward.
    final DailyCandle seed = candles[period];
    results.add(
      AtrResult(
        date: seed.date,
        atr: atr,
        atrPercent: seed.close > 0 ? (atr / seed.close) * 100 : 0,
      ),
    );

    for (int i = period + 1; i < candles.length; i++) {
      final double tr = _trueRange(candles[i], candles[i - 1].close);
      atr = (atr * (period - 1) + tr) / period;
      final DailyCandle c = candles[i];
      results.add(
        AtrResult(
          date: c.date,
          atr: atr,
          atrPercent: c.close > 0 ? (atr / c.close) * 100 : 0,
        ),
      );
    }
    return results;
  }

  double _trueRange(DailyCandle candle, double prevClose) {
    final double hl = candle.high - candle.low;
    final double hc = (candle.high - prevClose).abs();
    final double lc = (candle.low - prevClose).abs();
    return hl > hc ? (hl > lc ? hl : lc) : (hc > lc ? hc : lc);
  }
}
