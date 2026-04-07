import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('BatchActionResult', () {
    test('counts successes, failures, and skips', () {
      const BatchActionResult result = BatchActionResult(
        action: 'Apply Aggressive',
        results: [
          BatchItemResult(ticker: 'AAPL', status: BatchItemStatus.success),
          BatchItemResult(ticker: 'MSFT', status: BatchItemStatus.success),
          BatchItemResult(
            ticker: 'GOOG',
            status: BatchItemStatus.failure,
            message: 'Not found',
          ),
          BatchItemResult(ticker: 'TSLA', status: BatchItemStatus.skipped),
        ],
      );
      expect(result.successCount, 2);
      expect(result.failureCount, 1);
      expect(result.skippedCount, 1);
      expect(result.total, 4);
      expect(result.allSucceeded, isFalse);
    });

    test('allSucceeded when no failures', () {
      const BatchActionResult result = BatchActionResult(
        action: 'Enable alerts',
        results: [
          BatchItemResult(ticker: 'AAPL', status: BatchItemStatus.success),
          BatchItemResult(ticker: 'MSFT', status: BatchItemStatus.skipped),
        ],
      );
      expect(result.allSucceeded, isTrue);
    });

    test('empty results', () {
      const BatchActionResult result = BatchActionResult(
        action: 'Delete',
        results: [],
      );
      expect(result.total, 0);
      expect(result.allSucceeded, isTrue);
    });

    test('BatchItemResult equality', () {
      const BatchItemResult a = BatchItemResult(
        ticker: 'AAPL',
        status: BatchItemStatus.success,
      );
      const BatchItemResult b = BatchItemResult(
        ticker: 'AAPL',
        status: BatchItemStatus.success,
      );
      expect(a, equals(b));
    });

    test('BatchActionResult equality', () {
      const BatchActionResult a = BatchActionResult(
        action: 'test',
        results: [
          BatchItemResult(ticker: 'AAPL', status: BatchItemStatus.success),
        ],
      );
      const BatchActionResult b = BatchActionResult(
        action: 'test',
        results: [
          BatchItemResult(ticker: 'AAPL', status: BatchItemStatus.success),
        ],
      );
      expect(a, equals(b));
    });
  });
}
