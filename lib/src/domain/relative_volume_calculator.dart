/// Relative Volume Calculator — computes the ratio of current volume
/// to average volume over a lookback period to detect unusual activity.
library;

import 'package:equatable/equatable.dart';

import 'entities.dart';

/// Volume classification based on relative volume.
enum VolumeLevel { veryLow, low, normal, high, veryHigh }

/// Result of relative volume analysis.
class RelativeVolumeResult extends Equatable {
  const RelativeVolumeResult({
    required this.ticker,
    required this.currentVolume,
    required this.averageVolume,
    required this.relativeVolume,
    required this.level,
    required this.lookbackDays,
  });

  final String ticker;
  final int currentVolume;
  final double averageVolume;

  /// Ratio of current to average (1.0 = exactly average).
  final double relativeVolume;

  final VolumeLevel level;
  final int lookbackDays;

  @override
  List<Object?> get props => [
    ticker,
    currentVolume,
    averageVolume,
    relativeVolume,
    level,
    lookbackDays,
  ];
}

/// Computes relative volume from candle data.
class RelativeVolumeCalculator {
  const RelativeVolumeCalculator({
    this.lowThreshold = 0.5,
    this.highThreshold = 1.5,
    this.veryHighThreshold = 2.5,
  });

  final double lowThreshold;
  final double highThreshold;
  final double veryHighThreshold;

  /// Compute relative volume for the most recent candle.
  RelativeVolumeResult? compute({
    required String ticker,
    required List<DailyCandle> candles,
    int lookback = 20,
  }) {
    if (candles.length < lookback + 1) return null;

    final current = candles.last.volume;
    var sum = 0;
    for (int i = candles.length - 1 - lookback; i < candles.length - 1; i++) {
      sum += candles[i].volume;
    }
    final avg = sum / lookback;
    final rvol = avg > 0 ? current / avg : 0.0;

    return RelativeVolumeResult(
      ticker: ticker,
      currentVolume: current,
      averageVolume: avg,
      relativeVolume: rvol,
      level: _classify(rvol),
      lookbackDays: lookback,
    );
  }

  VolumeLevel _classify(double rvol) {
    if (rvol >= veryHighThreshold) return VolumeLevel.veryHigh;
    if (rvol >= highThreshold) return VolumeLevel.high;
    if (rvol >= lowThreshold) return VolumeLevel.normal;
    if (rvol >= 0.25) return VolumeLevel.low;
    return VolumeLevel.veryLow;
  }
}
