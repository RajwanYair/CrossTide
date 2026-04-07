/// Price Action Scorer — composite momentum/reversal score based on
/// recent price behavior (candle patterns, trend direction, momentum).
library;

import 'package:equatable/equatable.dart';

import 'entities.dart';

/// Bias detected from price action.
enum PriceActionBias { bullish, bearish, neutral }

/// Result of price action scoring.
class PriceActionResult extends Equatable {
  const PriceActionResult({
    required this.ticker,
    required this.score,
    required this.bias,
    required this.trendScore,
    required this.momentumScore,
    required this.candleScore,
  });

  final String ticker;

  /// Composite score (−100 to +100). Positive = bullish, negative = bearish.
  final double score;

  final PriceActionBias bias;

  /// Sub-score from price trend (−100 to +100).
  final double trendScore;

  /// Sub-score from momentum (rate of change) (−100 to +100).
  final double momentumScore;

  /// Sub-score from recent candle patterns (−100 to +100).
  final double candleScore;

  @override
  List<Object?> get props => [
    ticker,
    score,
    bias,
    trendScore,
    momentumScore,
    candleScore,
  ];
}

/// Computes a price action score from candle data.
class PriceActionScorer {
  const PriceActionScorer({this.lookback = 20});

  /// Number of candles to analyze.
  final int lookback;

  /// Score the price action for a ticker.
  PriceActionResult? score({
    required String ticker,
    required List<DailyCandle> candles,
  }) {
    if (candles.length < lookback + 1) return null;

    final window = candles.sublist(candles.length - lookback);

    final trendScore = _trendScore(window);
    final momentumScore = _momentumScore(window);
    final candleScore = _candleScore(window);

    final composite = (trendScore + momentumScore + candleScore) / 3;

    final PriceActionBias bias;
    if (composite > 10) {
      bias = PriceActionBias.bullish;
    } else if (composite < -10) {
      bias = PriceActionBias.bearish;
    } else {
      bias = PriceActionBias.neutral;
    }

    return PriceActionResult(
      ticker: ticker,
      score: composite,
      bias: bias,
      trendScore: trendScore,
      momentumScore: momentumScore,
      candleScore: candleScore,
    );
  }

  /// Trend: percentage of candles closing higher than previous.
  double _trendScore(List<DailyCandle> window) {
    var upCount = 0;
    for (int i = 1; i < window.length; i++) {
      if (window[i].close > window[i - 1].close) upCount++;
    }
    final upPct = upCount / (window.length - 1);
    return (upPct - 0.5) * 200; // Normalize to −100..+100
  }

  /// Momentum: rate of change over the window.
  double _momentumScore(List<DailyCandle> window) {
    final start = window.first.close;
    final end = window.last.close;
    if (start == 0) return 0;
    final roc = ((end - start) / start) * 100;
    return roc.clamp(-100, 100);
  }

  /// Candle: recent candle body ratios (bullish bodies vs bearish).
  double _candleScore(List<DailyCandle> window) {
    final recent = window.length > 5
        ? window.sublist(window.length - 5)
        : window;
    var bullishBodies = 0;
    var bearishBodies = 0;
    for (final DailyCandle c in recent) {
      if (c.close > c.open) {
        bullishBodies++;
      } else if (c.close < c.open) {
        bearishBodies++;
      }
    }
    final total = bullishBodies + bearishBodies;
    if (total == 0) return 0;
    return ((bullishBodies - bearishBodies) / total) * 100;
  }
}
