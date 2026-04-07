import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const calendar = TradingSessionCalendar();

  group('TradingSessionCalendar', () {
    test('NYSE is regular during trading hours', () {
      // Wednesday 15:00 UTC = 10:00 AM ET
      final status = calendar.checkSession(
        exchange: Exchange.nyse,
        utcTime: DateTime.utc(2025, 4, 9, 15, 0),
      );
      expect(status.phase, ExchangeSessionPhase.regular);
      expect(status.isOpen, isTrue);
    });

    test('NYSE is closed on weekends', () {
      // Saturday
      final status = calendar.checkSession(
        exchange: Exchange.nyse,
        utcTime: DateTime.utc(2025, 4, 12, 15, 0),
      );
      expect(status.phase, ExchangeSessionPhase.closed);
      expect(status.isOpen, isFalse);
    });

    test('NYSE pre-market detected', () {
      // Wednesday 9:00 UTC = 5:00 AM ET (pre-market)
      final status = calendar.checkSession(
        exchange: Exchange.nyse,
        utcTime: DateTime.utc(2025, 4, 9, 9, 0),
      );
      expect(status.phase, ExchangeSessionPhase.preMarket);
      expect(status.isExtendedHours, isTrue);
    });

    test('NYSE after-hours detected', () {
      // Wednesday 21:00 UTC = 5:00 PM ET (after-hours)
      final status = calendar.checkSession(
        exchange: Exchange.nyse,
        utcTime: DateTime.utc(2025, 4, 9, 21, 0),
      );
      expect(status.phase, ExchangeSessionPhase.afterHours);
    });

    test('checkAll returns statuses for all exchanges', () {
      final statuses = calendar.checkAll(DateTime.utc(2025, 4, 9, 15, 0));
      expect(statuses.length, Exchange.values.length);
    });
  });
}
