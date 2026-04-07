import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const WatchlistSorter sorter = WatchlistSorter();

  group('WatchlistSorter', () {
    test('alphabetical sorting', () {
      final List<SortableTicker> tickers = [
        const SortableTicker(symbol: 'MSFT'),
        const SortableTicker(symbol: 'AAPL'),
        const SortableTicker(symbol: 'GOOG'),
      ];
      final List<SortableTicker> result = sorter.sort(
        tickers,
        SortCriteria.alphabetical,
      );
      expect(result.map((SortableTicker t) => t.symbol).toList(), [
        'AAPL',
        'GOOG',
        'MSFT',
      ]);
    });

    test('distanceFromSma200Desc sort highest first', () {
      final List<SortableTicker> tickers = [
        const SortableTicker(symbol: 'A', distanceFromSma200: 5),
        const SortableTicker(symbol: 'B', distanceFromSma200: 15),
        const SortableTicker(symbol: 'C', distanceFromSma200: -3),
      ];
      final List<SortableTicker> result = sorter.sort(
        tickers,
        SortCriteria.distanceFromSma200Desc,
      );
      expect(result.map((SortableTicker t) => t.symbol).toList(), [
        'B',
        'A',
        'C',
      ]);
    });

    test('distanceFromSma200Asc sort lowest first', () {
      final List<SortableTicker> tickers = [
        const SortableTicker(symbol: 'A', distanceFromSma200: 5),
        const SortableTicker(symbol: 'B', distanceFromSma200: 15),
        const SortableTicker(symbol: 'C', distanceFromSma200: -3),
      ];
      final List<SortableTicker> result = sorter.sort(
        tickers,
        SortCriteria.distanceFromSma200Asc,
      );
      expect(result.map((SortableTicker t) => t.symbol).toList(), [
        'C',
        'A',
        'B',
      ]);
    });

    test('sector sorting alphabetically', () {
      final List<SortableTicker> tickers = [
        const SortableTicker(symbol: 'A', sector: 'Tech'),
        const SortableTicker(symbol: 'B', sector: 'Energy'),
        const SortableTicker(symbol: 'C', sector: 'Finance'),
      ];
      final List<SortableTicker> result = sorter.sort(
        tickers,
        SortCriteria.sector,
      );
      expect(result.map((SortableTicker t) => t.symbol).toList(), [
        'B',
        'C',
        'A',
      ]);
    });

    test('volumeDesc sort highest first', () {
      final List<SortableTicker> tickers = [
        const SortableTicker(symbol: 'A', volume: 1000),
        const SortableTicker(symbol: 'B', volume: 50000),
        const SortableTicker(symbol: 'C', volume: 10000),
      ];
      final List<SortableTicker> result = sorter.sort(
        tickers,
        SortCriteria.volumeDesc,
      );
      expect(result.map((SortableTicker t) => t.symbol).toList(), [
        'B',
        'C',
        'A',
      ]);
    });

    test('dailyChangeDesc sort best first', () {
      final List<SortableTicker> tickers = [
        const SortableTicker(symbol: 'A', dailyChangePct: -2),
        const SortableTicker(symbol: 'B', dailyChangePct: 5),
        const SortableTicker(symbol: 'C', dailyChangePct: 1),
      ];
      final List<SortableTicker> result = sorter.sort(
        tickers,
        SortCriteria.dailyChangeDesc,
      );
      expect(result.map((SortableTicker t) => t.symbol).toList(), [
        'B',
        'C',
        'A',
      ]);
    });

    test('dailyChangeAsc sort worst first', () {
      final List<SortableTicker> tickers = [
        const SortableTicker(symbol: 'A', dailyChangePct: -2),
        const SortableTicker(symbol: 'B', dailyChangePct: 5),
        const SortableTicker(symbol: 'C', dailyChangePct: 1),
      ];
      final List<SortableTicker> result = sorter.sort(
        tickers,
        SortCriteria.dailyChangeAsc,
      );
      expect(result.map((SortableTicker t) => t.symbol).toList(), [
        'A',
        'C',
        'B',
      ]);
    });

    test('null values sorted to end', () {
      final List<SortableTicker> tickers = [
        const SortableTicker(symbol: 'A'),
        const SortableTicker(symbol: 'B', distanceFromSma200: 5),
        const SortableTicker(symbol: 'C', distanceFromSma200: 10),
      ];
      final List<SortableTicker> result = sorter.sort(
        tickers,
        SortCriteria.distanceFromSma200Desc,
      );
      expect(result.last.symbol, 'A');
    });

    test('empty list returns empty', () {
      expect(sorter.sort([], SortCriteria.alphabetical), isEmpty);
    });

    test('SortableTicker equality', () {
      const SortableTicker a = SortableTicker(symbol: 'AAPL', volume: 1000);
      const SortableTicker b = SortableTicker(symbol: 'AAPL', volume: 1000);
      expect(a, equals(b));
    });
  });
}
