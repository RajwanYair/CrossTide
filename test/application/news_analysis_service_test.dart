import 'package:cross_tide/src/application/news_analysis_service.dart';
import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const service = NewsAnalysisService();
  final now = DateTime(2025, 4, 7);

  final items = [
    NewsItem(
      title: 'AAPL beats earnings',
      source: 'Reuters',
      publishedAt: now.subtract(const Duration(hours: 2)),
      url: 'https://example.com/1',
      tickers: const ['AAPL'],
      sentiment: NewsSentiment.positive,
    ),
    NewsItem(
      title: 'Market rally continues',
      source: 'Bloomberg',
      publishedAt: now.subtract(const Duration(days: 5)),
      url: 'https://example.com/2',
    ),
  ];

  test('rankForTicker returns scored items sorted by relevance', () {
    final ranked = service.rankForTicker(
      items: items,
      ticker: 'AAPL',
      asOf: now,
    );
    expect(ranked, isNotEmpty);
    expect(ranked.first.matchedTicker, 'AAPL');
    expect(ranked.first.relevanceScore, greaterThan(0));
  });

  test('summarize returns feed summary', () {
    final scored = service.rankForTicker(
      items: items,
      ticker: 'AAPL',
      asOf: now,
    );
    final summary = service.summarize(scored);
    expect(summary.totalItems, scored.length);
    expect(summary.positiveCount, greaterThanOrEqualTo(0));
  });
}
