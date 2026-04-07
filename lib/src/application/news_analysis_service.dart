/// News Analysis Service — application-layer orchestration.
///
/// Wraps [NewsRelevanceScorer] to rank and summarise news items
/// for a given set of watchlist tickers.
library;

import '../domain/domain.dart';

/// Orchestrates news relevance scoring for a watchlist.
class NewsAnalysisService {
  const NewsAnalysisService({
    NewsRelevanceScorer scorer = const NewsRelevanceScorer(),
  }) : _scorer = scorer;

  final NewsRelevanceScorer _scorer;

  /// Score and rank news items for a specific ticker.
  List<ScoredNewsItem> rankForTicker({
    required List<NewsItem> items,
    required String ticker,
    required DateTime asOf,
    int limit = 10,
  }) {
    return _scorer.rankForTicker(
      items: items,
      ticker: ticker,
      asOf: asOf,
      limit: limit,
    );
  }

  /// Build a summary from pre-scored items.
  NewsFeedSummary summarize(List<ScoredNewsItem> scoredItems) {
    return _scorer.summarize(scoredItems);
  }
}
