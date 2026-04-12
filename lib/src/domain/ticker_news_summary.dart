import 'package:equatable/equatable.dart';

/// Overall sentiment tone for a news article or ticker news feed.
enum TickerNewsSentiment {
  /// Positive news likely to drive price appreciation.
  bullish,

  /// Negative news likely to depress price.
  bearish,

  /// Neutral or informational content.
  neutral,
}

/// Aggregated news summary for a single ticker within a time window.
class TickerNewsSummary extends Equatable {
  /// Creates a [TickerNewsSummary].
  const TickerNewsSummary({
    required this.ticker,
    required this.windowHours,
    required this.articleCount,
    required this.sentimentScore,
    required this.dominantSentiment,
    required this.topHeadline,
  });

  /// Ticker symbol.
  final String ticker;

  /// Time window in hours over which news was aggregated.
  final int windowHours;

  /// Total number of articles ingested.
  final int articleCount;

  /// Aggregate sentiment score normalised to [-1.0, 1.0].
  final double sentimentScore;

  /// Most frequent sentiment category within the window.
  final TickerNewsSentiment dominantSentiment;

  /// Headline of the most prominent article.
  final String topHeadline;

  /// Returns `true` when the dominant sentiment is bullish.
  bool get isBullish => dominantSentiment == TickerNewsSentiment.bullish;

  /// Returns `true` when the dominant sentiment is bearish.
  bool get isBearish => dominantSentiment == TickerNewsSentiment.bearish;

  /// Returns `true` when at least one article was ingested.
  bool get hasNews => articleCount > 0;

  @override
  List<Object?> get props => [
    ticker,
    windowHours,
    articleCount,
    sentimentScore,
    dominantSentiment,
    topHeadline,
  ];
}
