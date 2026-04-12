import 'package:cross_tide/src/domain/news_event_entry.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('NewsEventEntry', () {
    test('equality', () {
      final a = NewsEventEntry(
        eventId: 'ne1',
        ticker: 'NVDA',
        headline: 'NVDA beats earnings',
        source: 'Reuters',
        sentiment: NewsEventSentiment.positive,
        publishedAt: DateTime(2025, 5, 10),
      );
      final b = NewsEventEntry(
        eventId: 'ne1',
        ticker: 'NVDA',
        headline: 'NVDA beats earnings',
        source: 'Reuters',
        sentiment: NewsEventSentiment.positive,
        publishedAt: DateTime(2025, 5, 10),
      );
      expect(a, b);
    });

    test('copyWith changes headline', () {
      final base = NewsEventEntry(
        eventId: 'ne1',
        ticker: 'NVDA',
        headline: 'NVDA beats earnings',
        source: 'Reuters',
        sentiment: NewsEventSentiment.positive,
        publishedAt: DateTime(2025, 5, 10),
      );
      final updated = base.copyWith(headline: 'NVDA guidance raised');
      expect(updated.headline, 'NVDA guidance raised');
    });

    test('props length is 9', () {
      final obj = NewsEventEntry(
        eventId: 'ne1',
        ticker: 'NVDA',
        headline: 'NVDA beats earnings',
        source: 'Reuters',
        sentiment: NewsEventSentiment.positive,
        publishedAt: DateTime(2025, 5, 10),
      );
      expect(obj.props.length, 9);
    });
  });
}
