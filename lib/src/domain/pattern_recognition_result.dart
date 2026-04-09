/// Pattern Recognition Result — historical pattern match with outcome statistics.
library;

import 'package:equatable/equatable.dart';

/// Category of the recognised technical or price pattern.
enum PatternCategory {
  /// SMA-based setup (e.g. price near 200-day average).
  smaSetup,

  /// Candlestick formation (Doji, Hammer, Engulfing, etc.).
  candleFormation,

  /// Unusual volume pattern relative to average.
  volumePattern,

  /// Trend reversal signal (head-and-shoulders, double bottom, etc.).
  trendReversal,

  /// Price breakout above resistance or below support.
  breakout,
}

/// Compact descriptor that uniquely identifies a pattern shape.
class PatternFingerprint extends Equatable {
  const PatternFingerprint({
    required this.category,
    required this.name,
    required this.lookbackBars,
    required this.featureHash,
  });

  final PatternCategory category;
  final String name;

  /// Number of historical bars used to form the pattern.
  final int lookbackBars;

  /// Compact hash of the normalised candle shape — used for similarity matching.
  final String featureHash;

  @override
  List<Object?> get props => [category, name, lookbackBars, featureHash];
}

/// Historical outcome statistics for matches of a pattern.
class PatternOutcome extends Equatable {
  const PatternOutcome({
    required this.totalMatches,
    required this.profitableMatches,
    required this.avgReturnPct,
    required this.avgHoldingDays,
    required this.maxGainPct,
    required this.maxLossPct,
  });

  final int totalMatches;
  final int profitableMatches;
  final double avgReturnPct;
  final double avgHoldingDays;
  final double maxGainPct;
  final double maxLossPct;

  /// Fraction of historical matches where the trade was profitable.
  double get winRate =>
      totalMatches == 0 ? 0.0 : profitableMatches / totalMatches;

  @override
  List<Object?> get props => [
    totalMatches,
    profitableMatches,
    avgReturnPct,
    avgHoldingDays,
    maxGainPct,
    maxLossPct,
  ];
}

/// The result of matching a pattern in the current candle series for a ticker.
class PatternRecognitionResult extends Equatable {
  const PatternRecognitionResult({
    required this.ticker,
    required this.fingerprint,
    required this.outcome,
    required this.matchedAt,
    required this.confidenceScore,
  }) : assert(
         confidenceScore >= 0.0 && confidenceScore <= 1.0,
         'confidenceScore must be in [0.0, 1.0]',
       );

  final String ticker;
  final PatternFingerprint fingerprint;
  final PatternOutcome outcome;
  final DateTime matchedAt;

  /// Confidence that the current setup matches the historical fingerprint: 0.0–1.0.
  final double confidenceScore;

  /// Returns true when [confidenceScore] is ≥ 0.75.
  bool get isHighConfidence => confidenceScore >= 0.75;

  @override
  List<Object?> get props => [
    ticker,
    fingerprint,
    outcome,
    matchedAt,
    confidenceScore,
  ];
}
