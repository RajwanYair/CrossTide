import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('WatchlistGroup', () {
    test('basic construction', () {
      const WatchlistGroup group = WatchlistGroup(
        id: 'g1',
        name: 'Tech',
        tickers: ['AAPL', 'MSFT'],
        colorHex: '#FF5733',
      );
      expect(group.count, 2);
      expect(group.isEmpty, isFalse);
      expect(group.isNotEmpty, isTrue);
    });

    test('empty group has zero count', () {
      const WatchlistGroup group = WatchlistGroup(id: 'g1', name: 'Empty');
      expect(group.count, 0);
      expect(group.isEmpty, isTrue);
      expect(group.isNotEmpty, isFalse);
    });

    test('contains is case-insensitive', () {
      const WatchlistGroup group = WatchlistGroup(
        id: 'g1',
        name: 'Tech',
        tickers: ['AAPL', 'MSFT'],
      );
      expect(group.contains('aapl'), isTrue);
      expect(group.contains('MSFT'), isTrue);
      expect(group.contains('GOOG'), isFalse);
    });

    test('addTicker adds new ticker', () {
      const WatchlistGroup group = WatchlistGroup(
        id: 'g1',
        name: 'Tech',
        tickers: ['AAPL'],
      );
      final WatchlistGroup updated = group.addTicker('msft');
      expect(updated.tickers, ['AAPL', 'MSFT']);
    });

    test('addTicker skips duplicate', () {
      const WatchlistGroup group = WatchlistGroup(
        id: 'g1',
        name: 'Tech',
        tickers: ['AAPL'],
      );
      final WatchlistGroup updated = group.addTicker('aapl');
      expect(updated.tickers, ['AAPL']);
    });

    test('removeTicker removes case-insensitively', () {
      const WatchlistGroup group = WatchlistGroup(
        id: 'g1',
        name: 'Tech',
        tickers: ['AAPL', 'MSFT'],
      );
      final WatchlistGroup updated = group.removeTicker('aapl');
      expect(updated.tickers, ['MSFT']);
    });

    test('reorderTicker moves ticker to new position', () {
      const WatchlistGroup group = WatchlistGroup(
        id: 'g1',
        name: 'Tech',
        tickers: ['AAPL', 'MSFT', 'GOOG'],
      );
      final WatchlistGroup updated = group.reorderTicker('GOOG', 0);
      expect(updated.tickers, ['GOOG', 'AAPL', 'MSFT']);
    });

    test('reorderTicker returns self for invalid index', () {
      const WatchlistGroup group = WatchlistGroup(
        id: 'g1',
        name: 'Tech',
        tickers: ['AAPL', 'MSFT'],
      );
      final WatchlistGroup updated = group.reorderTicker('AAPL', -1);
      expect(updated, group);
    });

    test('reorderTicker returns self for unknown ticker', () {
      const WatchlistGroup group = WatchlistGroup(
        id: 'g1',
        name: 'Tech',
        tickers: ['AAPL', 'MSFT'],
      );
      final WatchlistGroup updated = group.reorderTicker('GOOG', 0);
      expect(updated, group);
    });

    test('copyWith updates fields', () {
      const WatchlistGroup group = WatchlistGroup(
        id: 'g1',
        name: 'Tech',
        colorHex: '#FF5733',
      );
      final WatchlistGroup updated = group.copyWith(
        name: 'Technology',
        colorHex: () => null,
      );
      expect(updated.name, 'Technology');
      expect(updated.colorHex, isNull);
      expect(updated.id, 'g1');
    });

    test('equality via Equatable', () {
      const WatchlistGroup a = WatchlistGroup(
        id: 'g1',
        name: 'Tech',
        tickers: ['AAPL'],
      );
      const WatchlistGroup b = WatchlistGroup(
        id: 'g1',
        name: 'Tech',
        tickers: ['AAPL'],
      );
      expect(a, equals(b));
    });
  });
}
