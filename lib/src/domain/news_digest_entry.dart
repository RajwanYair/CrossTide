import 'package:equatable/equatable.dart';

/// Category of a news digest entry.
enum NewsDigestCategory {
  earnings,
  macroEconomic,
  sectorNews,
  companyAnnouncement,
  marketMovers,
  generalMarket,
}

/// Urgency level of a news digest entry.
enum NewsDigestUrgency { low, medium, high, breaking }

/// A single news item in a market news digest.
class NewsDigestEntry extends Equatable {
  const NewsDigestEntry({
    required this.entryId,
    required this.headline,
    required this.category,
    required this.urgency,
    required this.publishedAt,
    this.ticker,
    this.sourceName,
    this.summaryText,
  });

  final String entryId;
  final String headline;
  final NewsDigestCategory category;
  final NewsDigestUrgency urgency;
  final DateTime publishedAt;

  /// Related ticker symbol. Null for general market news.
  final String? ticker;

  final String? sourceName;
  final String? summaryText;

  bool get isBreaking => urgency == NewsDigestUrgency.breaking;
  bool get isTickerSpecific => ticker != null;

  @override
  List<Object?> get props => [
    entryId,
    headline,
    category,
    urgency,
    publishedAt,
    ticker,
    sourceName,
    summaryText,
  ];
}

/// Summary of a curated market news digest for a given period.
class NewsDigestSummary extends Equatable {
  const NewsDigestSummary({
    required this.digestId,
    required this.generatedAt,
    required this.entries,
  });

  final String digestId;
  final DateTime generatedAt;
  final List<NewsDigestEntry> entries;

  List<NewsDigestEntry> get breakingEntries =>
      entries.where((NewsDigestEntry e) => e.isBreaking).toList();

  List<NewsDigestEntry> byCategory(NewsDigestCategory cat) =>
      entries.where((NewsDigestEntry e) => e.category == cat).toList();

  int get totalCount => entries.length;
  bool get isEmpty => entries.isEmpty;

  @override
  List<Object?> get props => [digestId, generatedAt, entries];
}
