/// Volatility Regime Detector — classifies market conditions into
/// low, normal, or high volatility regimes using ATR percentile ranking.
library;

import 'package:equatable/equatable.dart';

import 'entities.dart';

/// The volatility regime classification.
enum VolatilityRegime { low, normal, high }

/// Result of regime detection for a ticker.
class VolatilityRegimeResult extends Equatable {
  const VolatilityRegimeResult({
    required this.ticker,
    required this.regime,
    required this.currentAtr,
    required this.atrPercentile,
    required this.lookbackDays,
  });

  final String ticker;
  final VolatilityRegime regime;

  /// Current ATR value.
  final double currentAtr;

  /// Percentile rank of current ATR within the lookback window (0–100).
  final double atrPercentile;

  /// Number of days used for the lookback.
  final int lookbackDays;

  @override
  List<Object?> get props => [
    ticker,
    regime,
    currentAtr,
    atrPercentile,
    lookbackDays,
  ];
}

/// Detects volatility regime from candle data.
class VolatilityRegimeDetector {
  const VolatilityRegimeDetector({
    this.lowThreshold = 25.0,
    this.highThreshold = 75.0,
  });

  /// ATR percentile below which regime is "low".
  final double lowThreshold;

  /// ATR percentile above which regime is "high".
  final double highThreshold;

  /// Detect the regime for the given candles.
  ///
  /// [period] is the ATR period (default 14).
  /// [lookback] is the number of ATR values to rank against.
  VolatilityRegimeResult? detect({
    required String ticker,
    required List<DailyCandle> candles,
    int period = 14,
    int lookback = 252,
  }) {
    if (candles.length < period + 1) return null;

    final atrValues = <double>[];
    for (int i = period; i < candles.length; i++) {
      var sum = 0.0;
      for (int j = i - period + 1; j <= i; j++) {
        final DailyCandle current = candles[j];
        final DailyCandle prev = candles[j - 1];
        final tr = _trueRange(current, prev);
        sum += tr;
      }
      atrValues.add(sum / period);
    }

    if (atrValues.isEmpty) return null;

    final currentAtr = atrValues.last;
    final window = atrValues.length > lookback
        ? atrValues.sublist(atrValues.length - lookback)
        : atrValues;

    final sorted = window.toList()..sort();
    final rank = sorted.indexWhere((double v) => v >= currentAtr);
    final percentile = (rank / sorted.length) * 100;

    final VolatilityRegime regime;
    if (percentile <= lowThreshold) {
      regime = VolatilityRegime.low;
    } else if (percentile >= highThreshold) {
      regime = VolatilityRegime.high;
    } else {
      regime = VolatilityRegime.normal;
    }

    return VolatilityRegimeResult(
      ticker: ticker,
      regime: regime,
      currentAtr: currentAtr,
      atrPercentile: percentile,
      lookbackDays: window.length,
    );
  }

  double _trueRange(DailyCandle current, DailyCandle prev) {
    final hl = current.high - current.low;
    final hc = (current.high - prev.close).abs();
    final lc = (current.low - prev.close).abs();
    if (hl >= hc && hl >= lc) return hl;
    if (hc >= lc) return hc;
    return lc;
  }
}
