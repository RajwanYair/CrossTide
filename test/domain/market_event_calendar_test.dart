import 'package:cross_tide/src/domain/market_event_calendar.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('MarketEventCalendar', () {
    test('equality', () {
      const a = MarketEventCalendar(
        eventId: 'evt-1',
        ticker: 'AAPL',
        eventType: MarketEventType.earnings,
        eventDate: '2025-01-30',
        isConfirmed: true,
      );
      const b = MarketEventCalendar(
        eventId: 'evt-1',
        ticker: 'AAPL',
        eventType: MarketEventType.earnings,
        eventDate: '2025-01-30',
        isConfirmed: true,
      );
      expect(a, b);
    });

    test('copyWith changes isConfirmed', () {
      const base = MarketEventCalendar(
        eventId: 'evt-1',
        ticker: 'AAPL',
        eventType: MarketEventType.earnings,
        eventDate: '2025-01-30',
        isConfirmed: true,
      );
      final updated = base.copyWith(isConfirmed: false);
      expect(updated.isConfirmed, false);
    });

    test('props length is 5', () {
      const obj = MarketEventCalendar(
        eventId: 'evt-1',
        ticker: 'AAPL',
        eventType: MarketEventType.earnings,
        eventDate: '2025-01-30',
        isConfirmed: true,
      );
      expect(obj.props.length, 5);
    });
  });
}
