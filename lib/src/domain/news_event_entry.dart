import 'package:equatable/equatable.dart';

/// Sentiment polarity of a news event.
enum NewsEventSentiment { positive, negative, neutral, mixed }

/// A structured news event entry linked to a ticker.
class NewsEventEntry extends Equatable {
  const NewsEventEntry({
    required this.eventId,
    required this.ticker,
    required this.headline,
    required this.source,
    required this.sentiment,
    required this.publishedAt,
    this.summary,
    this.url,
    this.relevanceScore,
  });

  final String eventId;
  final String ticker;
  final String headline;
  final String source;
  final NewsEventSentiment sentiment;
  final DateTime publishedAt;

  final String? summary;
  final String? url;

  /// Relevance score to the ticker (0.0–1.0).
  final double? relevanceScore;

  NewsEventEntry copyWith({
    String? eventId,
    String? ticker,
    String? headline,
    String? source,
    NewsEventSentiment? sentiment,
    DateTime? publishedAt,
    String? summary,
    String? url,
    double? relevanceScore,
  }) => NewsEventEntry(
    eventId: eventId ?? this.eventId,
    ticker: ticker ?? this.ticker,
    headline: headline ?? this.headline,
    source: source ?? this.source,
    sentiment: sentiment ?? this.sentiment,
    publishedAt: publishedAt ?? this.publishedAt,
    summary: summary ?? this.summary,
    url: url ?? this.url,
    relevanceScore: relevanceScore ?? this.relevanceScore,
  );

  @override
  List<Object?> get props => [
    eventId,
    ticker,
    headline,
    source,
    sentiment,
    publishedAt,
    summary,
    url,
    relevanceScore,
  ];
}
