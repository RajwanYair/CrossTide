import 'package:cross_tide/src/domain/data_ingestion_event.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('DataIngestionEvent', () {
    test('equality', () {
      final a = DataIngestionEvent(
        eventId: 'ev1',
        ticker: 'GOOG',
        providerName: 'YahooFinance',
        recordsFetched: 252,
        succeeded: true,
        durationMs: 340,
        occurredAt: DateTime(2025, 10, 1),
      );
      final b = DataIngestionEvent(
        eventId: 'ev1',
        ticker: 'GOOG',
        providerName: 'YahooFinance',
        recordsFetched: 252,
        succeeded: true,
        durationMs: 340,
        occurredAt: DateTime(2025, 10, 1),
      );
      expect(a, b);
    });

    test('copyWith changes recordsFetched', () {
      final base = DataIngestionEvent(
        eventId: 'ev1',
        ticker: 'GOOG',
        providerName: 'YahooFinance',
        recordsFetched: 252,
        succeeded: true,
        durationMs: 340,
        occurredAt: DateTime(2025, 10, 1),
      );
      final updated = base.copyWith(recordsFetched: 253);
      expect(updated.recordsFetched, 253);
    });

    test('props length is 8', () {
      final obj = DataIngestionEvent(
        eventId: 'ev1',
        ticker: 'GOOG',
        providerName: 'YahooFinance',
        recordsFetched: 252,
        succeeded: true,
        durationMs: 340,
        occurredAt: DateTime(2025, 10, 1),
      );
      expect(obj.props.length, 8);
    });
  });
}
