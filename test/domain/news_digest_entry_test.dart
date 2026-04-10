import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  final publishedAt = DateTime(2026, 4, 10, 9, 30);
  final generatedAt = DateTime(2026, 4, 10, 10, 0);

  group('NewsDigestEntry', () {
    test('isBreaking is true when urgency is breaking', () {
      final entry = NewsDigestEntry(
        entryId: 'e-1',
        headline: 'Fed raises rates',
        category: NewsDigestCategory.macroEconomic,
        urgency: NewsDigestUrgency.breaking,
        publishedAt: publishedAt,
      );
      expect(entry.isBreaking, isTrue);
    });

    test('isTickerSpecific is true when ticker set', () {
      final entry = NewsDigestEntry(
        entryId: 'e-2',
        headline: 'AAPL misses earnings',
        category: NewsDigestCategory.earnings,
        urgency: NewsDigestUrgency.high,
        publishedAt: publishedAt,
        ticker: 'AAPL',
      );
      expect(entry.isTickerSpecific, isTrue);
    });

    test('isTickerSpecific is false when ticker absent', () {
      final entry = NewsDigestEntry(
        entryId: 'e-3',
        headline: 'Market closes higher',
        category: NewsDigestCategory.generalMarket,
        urgency: NewsDigestUrgency.low,
        publishedAt: publishedAt,
      );
      expect(entry.isTickerSpecific, isFalse);
    });
  });

  group('NewsDigestSummary', () {
    test('breakingEntries filters correctly', () {
      final summary = NewsDigestSummary(
        digestId: 'd-1',
        generatedAt: generatedAt,
        entries: [
          NewsDigestEntry(
            entryId: 'e-1',
            headline: 'Breaking',
            category: NewsDigestCategory.macroEconomic,
            urgency: NewsDigestUrgency.breaking,
            publishedAt: publishedAt,
          ),
          NewsDigestEntry(
            entryId: 'e-2',
            headline: 'Normal',
            category: NewsDigestCategory.generalMarket,
            urgency: NewsDigestUrgency.low,
            publishedAt: publishedAt,
          ),
        ],
      );
      expect(summary.breakingEntries.length, equals(1));
    });

    test('isEmpty is true for empty entries', () {
      final empty = NewsDigestSummary(
        digestId: 'd-2',
        generatedAt: generatedAt,
        entries: const [],
      );
      expect(empty.isEmpty, isTrue);
      expect(empty.totalCount, equals(0));
    });

    test('byCategory filters correctly', () {
      final summary = NewsDigestSummary(
        digestId: 'd-3',
        generatedAt: generatedAt,
        entries: [
          NewsDigestEntry(
            entryId: 'e-1',
            headline: 'Earnings',
            category: NewsDigestCategory.earnings,
            urgency: NewsDigestUrgency.medium,
            publishedAt: publishedAt,
          ),
          NewsDigestEntry(
            entryId: 'e-2',
            headline: 'Macro',
            category: NewsDigestCategory.macroEconomic,
            urgency: NewsDigestUrgency.medium,
            publishedAt: publishedAt,
          ),
        ],
      );
      expect(summary.byCategory(NewsDigestCategory.earnings).length, equals(1));
      expect(
        summary.byCategory(NewsDigestCategory.companyAnnouncement).length,
        equals(0),
      );
    });
  });
}
