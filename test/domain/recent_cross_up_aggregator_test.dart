import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const RecentCrossUpAggregator aggregator = RecentCrossUpAggregator();

  AlertHistoryEntry entry(String symbol, AlertType type, DateTime firedAt) =>
      AlertHistoryEntry(
        symbol: symbol,
        alertType: type.name,
        message: '$symbol ${type.name}',
        firedAt: firedAt,
      );

  group('RecentCrossUpAggregator', () {
    test('empty history produces zero counts', () {
      final List<CrossUpBucket> buckets = aggregator.aggregate(
        [],
        asOf: DateTime(2024, 6, 15),
      );
      expect(buckets.length, 3);
      expect(buckets[0].label, 'Today');
      expect(buckets[0].count, 0);
      expect(buckets[1].label, 'This Week');
      expect(buckets[1].count, 0);
      expect(buckets[2].label, 'This Month');
      expect(buckets[2].count, 0);
    });

    test('today bucket counts entries from today only', () {
      final DateTime asOf = DateTime(2024, 6, 15, 14, 0);
      final List<AlertHistoryEntry> history = [
        entry('AAPL', AlertType.sma200CrossUp, DateTime(2024, 6, 15, 10, 0)),
        entry('MSFT', AlertType.sma200CrossUp, DateTime(2024, 6, 14, 10, 0)),
      ];
      final List<CrossUpBucket> buckets = aggregator.aggregate(
        history,
        asOf: asOf,
      );
      expect(buckets[0].count, 1);
      expect(buckets[0].tickers, ['AAPL']);
    });

    test('week bucket includes today and last 7 days', () {
      final DateTime asOf = DateTime(2024, 6, 15);
      final List<AlertHistoryEntry> history = [
        entry('AAPL', AlertType.sma200CrossUp, DateTime(2024, 6, 15, 10, 0)),
        entry('MSFT', AlertType.goldenCross, DateTime(2024, 6, 10, 10, 0)),
        entry('GOOG', AlertType.sma200CrossUp, DateTime(2024, 5, 1, 10, 0)),
      ];
      final List<CrossUpBucket> buckets = aggregator.aggregate(
        history,
        asOf: asOf,
      );
      expect(buckets[1].count, 2); // AAPL + MSFT
      expect(buckets[1].tickers, ['AAPL', 'MSFT']);
    });

    test('month bucket includes last 30 days', () {
      final DateTime asOf = DateTime(2024, 6, 15);
      final List<AlertHistoryEntry> history = [
        entry('AAPL', AlertType.sma200CrossUp, DateTime(2024, 6, 15, 10, 0)),
        entry('MSFT', AlertType.sma150CrossUp, DateTime(2024, 5, 20, 10, 0)),
        entry('GOOG', AlertType.sma50CrossUp, DateTime(2024, 5, 1, 10, 0)),
      ];
      final List<CrossUpBucket> buckets = aggregator.aggregate(
        history,
        asOf: asOf,
      );
      expect(buckets[2].count, 2); // AAPL + MSFT (GOOG is > 30 days ago)
    });

    test('non-crossup types are excluded', () {
      final DateTime asOf = DateTime(2024, 6, 15, 14, 0);
      final List<AlertHistoryEntry> history = [
        entry('AAPL', AlertType.sma200CrossUp, DateTime(2024, 6, 15, 10, 0)),
        entry('MSFT', AlertType.priceTarget, DateTime(2024, 6, 15, 10, 0)),
        entry('GOOG', AlertType.volumeSpike, DateTime(2024, 6, 15, 10, 0)),
      ];
      final List<CrossUpBucket> buckets = aggregator.aggregate(
        history,
        asOf: asOf,
      );
      expect(buckets[0].count, 1);
    });

    test('goldenCross and sma variants all count', () {
      final DateTime asOf = DateTime(2024, 6, 15, 14, 0);
      final List<AlertHistoryEntry> history = [
        entry('A', AlertType.sma200CrossUp, DateTime(2024, 6, 15, 10, 0)),
        entry('B', AlertType.sma150CrossUp, DateTime(2024, 6, 15, 10, 0)),
        entry('C', AlertType.sma50CrossUp, DateTime(2024, 6, 15, 10, 0)),
        entry('D', AlertType.goldenCross, DateTime(2024, 6, 15, 10, 0)),
      ];
      final List<CrossUpBucket> buckets = aggregator.aggregate(
        history,
        asOf: asOf,
      );
      expect(buckets[0].count, 4);
    });

    test('tickers are deduplicated in each bucket', () {
      final DateTime asOf = DateTime(2024, 6, 15, 14, 0);
      final List<AlertHistoryEntry> history = [
        entry('AAPL', AlertType.sma200CrossUp, DateTime(2024, 6, 15, 10, 0)),
        entry('AAPL', AlertType.sma50CrossUp, DateTime(2024, 6, 15, 11, 0)),
      ];
      final List<CrossUpBucket> buckets = aggregator.aggregate(
        history,
        asOf: asOf,
      );
      expect(buckets[0].count, 2); // two events
      expect(buckets[0].tickers, ['AAPL']); // but one unique ticker
    });

    test('CrossUpBucket equality', () {
      const CrossUpBucket a = CrossUpBucket(
        label: 'Today',
        count: 1,
        tickers: ['AAPL'],
      );
      const CrossUpBucket b = CrossUpBucket(
        label: 'Today',
        count: 1,
        tickers: ['AAPL'],
      );
      expect(a, equals(b));
    });
  });
}
