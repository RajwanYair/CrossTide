/// Sentiment Score — news and social-media sentiment per ticker.
library;

import 'package:equatable/equatable.dart';

/// Overall sentiment direction.
enum SentimentDirection {
  /// Net bullish signals across all sources.
  bullish,

  /// Mixed signals — no clear direction.
  neutral,

  /// Net bearish signals across all sources.
  bearish,
}

/// Source of a sentiment signal.
enum SentimentSource {
  /// News article headline and body.
  newsArticle,

  /// Twitter / X post.
  socialMedia,

  /// Analyst report.
  analystReport,

  /// Earnings call transcript.
  earningsCall,

  /// SEC filing keyword scan.
  secFiling,
}

/// Sentiment captured from a single source item.
class SentimentDataPoint extends Equatable {
  const SentimentDataPoint({
    required this.source,
    required this.score,
    required this.capturedAt,
    this.headline,
  }) : assert(
            score >= -1.0 && score <= 1.0,
            'score must be −1.0 (very bearish) to 1.0 (very bullish)');

  final SentimentSource source;

  /// Normalised sentiment score: −1.0 = very bearish, 0 = neutral, 1.0 = very bullish.
  final double score;

  final DateTime capturedAt;

  /// Optional headline or summary.
  final String? headline;

  @override
  List<Object?> get props => [source, score, capturedAt, headline];
}

/// Aggregated sentiment for a ticker over a rolling window.
class SentimentScore extends Equatable {
  const SentimentScore({
    required this.ticker,
    required this.direction,
    required this.compositeScore,
    required this.dataPoints,
    required this.windowHours,
    required this.evaluatedAt,
  }) : assert(
            compositeScore >= -1.0 && compositeScore <= 1.0,
            'compositeScore must be −1.0 to 1.0');

  final String ticker;

  /// Overall direction.
  final SentimentDirection direction;

  /// Weighted average of all data points (−1.0 to 1.0).
  final double compositeScore;

  /// All individual data points that contributed.
  final List<SentimentDataPoint> dataPoints;

  /// Rolling window used for aggregation (hours).
  final int windowHours;

  final DateTime evaluatedAt;

  /// Total number of contributing data points.
  int get count => dataPoints.length;

  /// True when the composite score crosses the bullish threshold (>0.2).
  bool get isBullish => compositeScore > 0.2;

  /// True when the composite score crosses the bearish threshold (<−0.2).
  bool get isBearish => compositeScore < -0.2;

  @override
  List<Object?> get props => [
        ticker,
        direction,
        compositeScore,
        dataPoints,
        windowHours,
        evaluatedAt,
      ];
}

/// Aggregates sentiment data points into a [SentimentScore].
class SentimentAggregator {
  const SentimentAggregator({this.windowHours = 24});

  final int windowHours;

  /// Aggregate [dataPoints] for [ticker].
  SentimentScore aggregate(
    String ticker,
    List<SentimentDataPoint> dataPoints, {
    DateTime? now,
  }) {
    final ts = now ?? DateTime.now();
    final cutoff = ts.subtract(Duration(hours: windowHours));
    final filtered =
        dataPoints.where((d) => d.capturedAt.isAfter(cutoff)).toList();

    if (filtered.isEmpty) {
      return SentimentScore(
        ticker: ticker,
        direction: SentimentDirection.neutral,
        compositeScore: 0.0,
        dataPoints: const [],
        windowHours: windowHours,
        evaluatedAt: ts,
      );
    }

    final composite =
        filtered.fold<double>(0, (a, d) => a + d.score) / filtered.length;

    final direction = composite > 0.2
        ? SentimentDirection.bullish
        : composite < -0.2
            ? SentimentDirection.bearish
            : SentimentDirection.neutral;

    return SentimentScore(
      ticker: ticker,
      direction: direction,
      compositeScore: composite,
      dataPoints: filtered,
      windowHours: windowHours,
      evaluatedAt: ts,
    );
  }
}
