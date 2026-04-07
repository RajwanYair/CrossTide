import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const TickerSearchIndex index = TickerSearchIndex();
  const List<TickerSearchEntry> entries = [
    TickerSearchEntry(symbol: 'AAPL', name: 'Apple Inc.', sector: 'Tech'),
    TickerSearchEntry(symbol: 'MSFT', name: 'Microsoft Corporation'),
    TickerSearchEntry(symbol: 'GOOG', name: 'Alphabet Inc.'),
    TickerSearchEntry(symbol: 'AMZN', name: 'Amazon.com Inc.'),
    TickerSearchEntry(symbol: 'TSLA', name: 'Tesla Inc.'),
    TickerSearchEntry(symbol: 'NFLX', name: 'Netflix Inc.'),
  ];

  group('TickerSearchIndex', () {
    test('empty query returns empty list', () {
      expect(index.search(entries, ''), isEmpty);
    });

    test('whitespace-only query returns empty list', () {
      expect(index.search(entries, '   '), isEmpty);
    });

    test('exact symbol match scores highest', () {
      final List<TickerSearchResult> results = index.search(entries, 'AAPL');
      expect(results.first.entry.symbol, 'AAPL');
      expect(results.first.score, 100);
    });

    test('symbol prefix match scores high', () {
      final List<TickerSearchResult> results = index.search(entries, 'AA');
      expect(results.first.entry.symbol, 'AAPL');
      expect(results.first.score, 80);
    });

    test('name contains query match', () {
      final List<TickerSearchResult> results = index.search(entries, 'Apple');
      expect(results.isNotEmpty, isTrue);
      expect(results.first.entry.symbol, 'AAPL');
    });

    test('case-insensitive matching', () {
      final List<TickerSearchResult> results = index.search(entries, 'aapl');
      expect(results.first.entry.symbol, 'AAPL');
      expect(results.first.score, 100);
    });

    test('name word boundary match', () {
      final List<TickerSearchResult> results = index.search(entries, 'Inc');
      expect(results.length, greaterThan(1));
    });

    test('no match returns empty', () {
      expect(index.search(entries, 'ZZZZ'), isEmpty);
    });

    test('results sorted by score descending', () {
      final List<TickerSearchResult> results = index.search(entries, 'A');
      for (int i = 1; i < results.length; i++) {
        expect(results[i].score, lessThanOrEqualTo(results[i - 1].score));
      }
    });

    test('TickerSearchEntry equality', () {
      const TickerSearchEntry a = TickerSearchEntry(
        symbol: 'AAPL',
        name: 'Apple Inc.',
      );
      const TickerSearchEntry b = TickerSearchEntry(
        symbol: 'AAPL',
        name: 'Apple Inc.',
      );
      expect(a, equals(b));
    });

    test('TickerSearchResult equality', () {
      const TickerSearchResult a = TickerSearchResult(
        entry: TickerSearchEntry(symbol: 'AAPL', name: 'Apple Inc.'),
        score: 100,
      );
      const TickerSearchResult b = TickerSearchResult(
        entry: TickerSearchEntry(symbol: 'AAPL', name: 'Apple Inc.'),
        score: 100,
      );
      expect(a, equals(b));
    });

    test('fuzzy match on symbol subsequence', () {
      final List<TickerSearchResult> results = index.search(entries, 'MFT');
      expect(results.isNotEmpty, isTrue);
      // MSFT should match because M-S-F-T contains M-F-T as subsequence
    });
  });
}
