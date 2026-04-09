/// News Article — in-app news feed article for a watchlist ticker.
library;

import 'package:equatable/equatable.dart';

/// Where the article was sourced from.
enum NewsSource {
  /// Generic RSS feed.
  rss,

  /// Atom feed.
  atom,

  /// Yahoo Finance news endpoint.
  yahooFinance,

  /// Reddit post (r/stocks, r/investing, etc.).
  reddit,

  /// SEC EDGAR filing.
  secEdgar,
}

/// Coarse sentiment hint carried by the article.
enum NewsSentimentHint {
  /// Article headline/body signals a positive development.
  positive,

  /// Article is factual/neutral with no clear directional signal.
  neutral,

  /// Article headline/body signals a negative development.
  negative,

  /// Sentiment could not be determined.
  unknown,
}

/// A single news article surfaced in the in-app feed.
class NewsArticle extends Equatable {
  const NewsArticle({
    required this.id,
    required this.ticker,
    required this.headline,
    required this.source,
    required this.publishedAt,
    required this.sentimentHint,
    this.summary,
    this.url,
    this.relevanceScore,
  }) : assert(
         relevanceScore == null ||
             (relevanceScore >= 0.0 && relevanceScore <= 1.0),
         'relevanceScore must be in [0.0, 1.0]',
       );

  /// Stable article identifier (hash of URL or provider-assigned ID).
  final String id;

  final String ticker;
  final String headline;
  final NewsSource source;
  final DateTime publishedAt;
  final NewsSentimentHint sentimentHint;

  /// Optional two-sentence summary of the article body.
  final String? summary;

  /// Source URL of the article.
  final String? url;

  /// Relevance to this ticker: 0.0 (unrelated) to 1.0 (highly relevant).
  /// null = not yet scored.
  final double? relevanceScore;

  /// Returns true when [relevanceScore] is ≥ 0.7.
  bool get isHighRelevance => relevanceScore != null && relevanceScore! >= 0.7;

  @override
  List<Object?> get props => [
    id,
    ticker,
    headline,
    source,
    publishedAt,
    sentimentHint,
    summary,
    url,
    relevanceScore,
  ];
}

/// Configuration for the in-app news feed.
class NewsFeedConfig extends Equatable {
  const NewsFeedConfig({
    required this.enabled,
    required this.sources,
    required this.maxArticlesPerTicker,
    required this.staleAfterHours,
  });

  factory NewsFeedConfig.defaults() => const NewsFeedConfig(
    enabled: true,
    sources: [NewsSource.yahooFinance, NewsSource.rss],
    maxArticlesPerTicker: 20,
    staleAfterHours: 24,
  );

  final bool enabled;
  final List<NewsSource> sources;
  final int maxArticlesPerTicker;

  /// Articles older than this many hours are hidden in the feed.
  final int staleAfterHours;

  @override
  List<Object?> get props => [
    enabled,
    sources,
    maxArticlesPerTicker,
    staleAfterHours,
  ];
}
