import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const screener = TickerScreener();

  final snapshots = [
    const ScreenerSnapshot(
      ticker: 'AAPL',
      values: {'close': 175, 'rsi': 45, 'volume': 5000000},
    ),
    const ScreenerSnapshot(
      ticker: 'MSFT',
      values: {'close': 310, 'rsi': 72, 'volume': 3000000},
    ),
    const ScreenerSnapshot(
      ticker: 'GOOG',
      values: {'close': 140, 'rsi': 28, 'volume': 8000000},
    ),
  ];

  group('TickerScreener', () {
    test('screen with gt filter', () {
      final result = screener.screen(
        snapshots: snapshots,
        criteria: [
          const ScreenerCriterion(field: 'close', op: 'gt', value: '200'),
        ],
      );
      expect(result.matchCount, 1);
      expect(result.matches.first.ticker, 'MSFT');
      expect(result.totalScanned, 3);
    });

    test('screen with lt filter', () {
      final result = screener.screen(
        snapshots: snapshots,
        criteria: [
          const ScreenerCriterion(field: 'rsi', op: 'lt', value: '30'),
        ],
      );
      expect(result.matchCount, 1);
      expect(result.matches.first.ticker, 'GOOG');
    });

    test('screen with between filter', () {
      final result = screener.screen(
        snapshots: snapshots,
        criteria: [
          const ScreenerCriterion(field: 'rsi', op: 'between', value: '30, 50'),
        ],
      );
      expect(result.matchCount, 1);
      expect(result.matches.first.ticker, 'AAPL');
    });

    test('screen with multiple criteria (AND)', () {
      final result = screener.screen(
        snapshots: snapshots,
        criteria: [
          const ScreenerCriterion(field: 'close', op: 'gt', value: '100'),
          const ScreenerCriterion(field: 'rsi', op: 'lt', value: '50'),
        ],
      );
      // AAPL: close 175 > 100 && rsi 45 < 50 ✓
      // GOOG: close 140 > 100 && rsi 28 < 50 ✓
      expect(result.matchCount, 2);
    });

    test('screen with no criteria returns all', () {
      final result = screener.screen(snapshots: snapshots, criteria: []);
      expect(result.matchCount, 3);
    });

    test('missing field in snapshot fails criterion', () {
      final result = screener.screen(
        snapshots: snapshots,
        criteria: [
          const ScreenerCriterion(field: 'macd', op: 'gt', value: '0'),
        ],
      );
      expect(result.matchCount, 0);
    });
  });
}
