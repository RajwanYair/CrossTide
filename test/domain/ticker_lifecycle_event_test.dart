import 'package:cross_tide/src/domain/ticker_lifecycle_event.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('TickerLifecycleEvent', () {
    test('equality', () {
      final a = TickerLifecycleEvent(
        ticker: 'TWITTER',
        eventType: TickerLifecycleEventType.delisted,
        eventDate: DateTime(2022, 10, 27),
        exchange: 'NASDAQ',
      );
      final b = TickerLifecycleEvent(
        ticker: 'TWITTER',
        eventType: TickerLifecycleEventType.delisted,
        eventDate: DateTime(2022, 10, 27),
        exchange: 'NASDAQ',
      );
      expect(a, b);
    });

    test('copyWith changes exchange', () {
      final base = TickerLifecycleEvent(
        ticker: 'TWITTER',
        eventType: TickerLifecycleEventType.delisted,
        eventDate: DateTime(2022, 10, 27),
        exchange: 'NASDAQ',
      );
      final updated = base.copyWith(exchange: 'NYSE');
      expect(updated.exchange, 'NYSE');
    });

    test('props length is 8', () {
      final obj = TickerLifecycleEvent(
        ticker: 'TWITTER',
        eventType: TickerLifecycleEventType.delisted,
        eventDate: DateTime(2022, 10, 27),
        exchange: 'NASDAQ',
      );
      expect(obj.props.length, 8);
    });
  });
}
