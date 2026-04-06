/// Volume spike detector — computes rolling average volume and detects spikes.
library;

import 'entities.dart';

/// Computes rolling average volume and identifies volume spikes.
///
/// A volume spike occurs when the most recent candle's volume is at least
/// [multiplier] × the [period]-day rolling average volume.
class VolumeCalculator {
  const VolumeCalculator();

  static const int defaultPeriod = 20;

  /// Returns the [period]-day rolling average volume at the latest candle.
  /// Returns null if fewer than [period] candles are available.
  double? averageVolume(
    List<DailyCandle> candles, {
    int period = defaultPeriod,
  }) {
    if (candles.length < period) return null;
    final slice = candles.sublist(candles.length - period, candles.length - 1);
    if (slice.isEmpty) return null;
    final sum = slice.fold<double>(0.0, (a, c) => a + c.volume.toDouble());
    return sum / slice.length;
  }

  /// Returns true if the latest candle's volume is ≥ [multiplier] × average.
  ///
  /// Returns false if insufficient data or average volume is zero.
  bool isSpike(
    List<DailyCandle> candles, {
    double multiplier = 2.0,
    int period = defaultPeriod,
  }) {
    if (candles.length < period + 1) return false;
    final avg = averageVolume(candles, period: period);
    if (avg == null || avg == 0) return false;
    return candles.last.volume.toDouble() >= multiplier * avg;
  }

  /// Returns the ratio of the latest candle's volume to the rolling average.
  /// Returns null if insufficient data.
  double? spikeRatio(List<DailyCandle> candles, {int period = defaultPeriod}) {
    if (candles.length < period + 1) return null;
    final avg = averageVolume(candles, period: period);
    if (avg == null || avg == 0) return null;
    return candles.last.volume.toDouble() / avg;
  }
}
