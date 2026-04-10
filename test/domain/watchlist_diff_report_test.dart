import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('WatchlistChangeEntry', () {
    test('priceDelta computes correctly when both prices present', () {
      const entry = WatchlistChangeEntry(
        ticker: 'AAPL',
        changeType: WatchlistChangeType.priceIncreased,
        previousPrice: 100.0,
        currentPrice: 110.0,
      );
      expect(entry.priceDelta, closeTo(10.0, 0.001));
    });

    test('priceDeltaPct computes correctly', () {
      const entry = WatchlistChangeEntry(
        ticker: 'AAPL',
        changeType: WatchlistChangeType.priceIncreased,
        previousPrice: 100.0,
        currentPrice: 110.0,
      );
      expect(entry.priceDeltaPct, closeTo(10.0, 0.001));
    });

    test('priceDelta is null when previousPrice absent', () {
      const entry = WatchlistChangeEntry(
        ticker: 'AAPL',
        changeType: WatchlistChangeType.added,
        currentPrice: 110.0,
      );
      expect(entry.priceDelta, isNull);
      expect(entry.priceDeltaPct, isNull);
    });

    test('equality holds for same props', () {
      const a = WatchlistChangeEntry(
        ticker: 'MSFT',
        changeType: WatchlistChangeType.removed,
      );
      const b = WatchlistChangeEntry(
        ticker: 'MSFT',
        changeType: WatchlistChangeType.removed,
      );
      expect(a, equals(b));
    });
  });

  group('WatchlistDiffReport', () {
    test('addedTickers returns correct tickers', () {
      const report = WatchlistDiffReport(
        snapshotIdBefore: 'snap-1',
        snapshotIdAfter: 'snap-2',
        changes: [
          WatchlistChangeEntry(
            ticker: 'TSLA',
            changeType: WatchlistChangeType.added,
          ),
          WatchlistChangeEntry(
            ticker: 'AAPL',
            changeType: WatchlistChangeType.priceIncreased,
            previousPrice: 100,
            currentPrice: 110,
          ),
        ],
      );
      expect(report.addedTickers, equals(['TSLA']));
      expect(report.removedTickers, isEmpty);
    });

    test('priceChanges filters correctly', () {
      const report = WatchlistDiffReport(
        snapshotIdBefore: 'a',
        snapshotIdAfter: 'b',
        changes: [
          WatchlistChangeEntry(
            ticker: 'AAPL',
            changeType: WatchlistChangeType.priceIncreased,
            previousPrice: 100,
            currentPrice: 110,
          ),
          WatchlistChangeEntry(
            ticker: 'MSFT',
            changeType: WatchlistChangeType.priceDecreased,
            previousPrice: 200,
            currentPrice: 190,
          ),
          WatchlistChangeEntry(
            ticker: 'GOOG',
            changeType: WatchlistChangeType.removed,
          ),
        ],
      );
      expect(report.priceChanges.length, equals(2));
    });

    test('hasStructuralChanges is true when tickers added', () {
      const report = WatchlistDiffReport(
        snapshotIdBefore: 'x',
        snapshotIdAfter: 'y',
        changes: [
          WatchlistChangeEntry(
            ticker: 'NVDA',
            changeType: WatchlistChangeType.added,
          ),
        ],
      );
      expect(report.hasStructuralChanges, isTrue);
    });

    test('hasStructuralChanges is false when only price changes', () {
      const report = WatchlistDiffReport(
        snapshotIdBefore: 'x',
        snapshotIdAfter: 'y',
        changes: [
          WatchlistChangeEntry(
            ticker: 'AAPL',
            changeType: WatchlistChangeType.priceIncreased,
            previousPrice: 100,
            currentPrice: 110,
          ),
        ],
      );
      expect(report.hasStructuralChanges, isFalse);
    });
  });
}
