import 'package:cross_tide/src/data/providers/batch_data_provider.dart';
import 'package:cross_tide/src/domain/entities.dart';
import 'package:flutter_test/flutter_test.dart';

import 'helpers.dart';

void main() {
  group('BatchDataProvider', () {
    test('fetches all tickers successfully', () async {
      final mock = MockProvider(
        candles: [
          DailyCandle(
            date: DateTime(2024, 1, 1),
            open: 100,
            high: 105,
            low: 95,
            close: 102,
            volume: 1000,
          ),
        ],
      );
      final batch = BatchDataProvider(provider: mock, maxConcurrency: 2);

      final results = await batch.fetchAll(['AAPL', 'MSFT', 'GOOG']);
      expect(results, hasLength(3));
      for (final BatchFetchResult r in results) {
        expect(r.isSuccess, isTrue);
        expect(r.candles, isNotEmpty);
        expect(r.durationMs, greaterThanOrEqualTo(0));
      }
    });

    test('captures errors without throwing', () async {
      final mock = FailingProvider();
      final batch = BatchDataProvider(provider: mock, maxConcurrency: 2);

      final results = await batch.fetchAll(['BAD']);
      expect(results, hasLength(1));
      expect(results[0].isSuccess, isFalse);
      expect(results[0].error, isNotNull);
    });

    test('empty tickers returns empty results', () async {
      final mock = MockProvider(candles: []);
      final batch = BatchDataProvider(provider: mock);

      final results = await batch.fetchAll([]);
      expect(results, isEmpty);
    });
  });
}
