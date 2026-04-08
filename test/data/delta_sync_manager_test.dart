import 'package:cross_tide/src/data/data.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('DeltaSyncManager', () {
    test('new tickers need sync', () {
      final manager = DeltaSyncManager();
      final record = manager.recordFor('AAPL');
      expect(record.needsSync(), isTrue);
    });

    test('recently synced ticker does not need sync', () {
      final manager = DeltaSyncManager();
      manager.markSynced('AAPL', totalCandles: 250);

      final record = manager.recordFor('AAPL');
      expect(record.needsSync(), isFalse);
      expect(record.candleCount, 250);
    });

    test('tickersNeedingSync returns stale tickers', () {
      final manager = DeltaSyncManager();
      manager.recordFor('AAPL'); // never synced → needs sync
      manager.markSynced('MSFT'); // just synced → fresh

      final stale = manager.tickersNeedingSync();
      expect(stale, contains('AAPL'));
      expect(stale, isNot(contains('MSFT')));
    });

    test('remove unregisters ticker', () {
      final manager = DeltaSyncManager();
      manager.markSynced('GOOG');
      manager.remove('GOOG');

      expect(manager.trackedTickers, isNot(contains('GOOG')));
    });

    test('clear removes all records', () {
      final manager = DeltaSyncManager();
      manager.markSynced('A');
      manager.markSynced('B');
      manager.clear();

      expect(manager.trackedTickers, isEmpty);
    });
  });
}
