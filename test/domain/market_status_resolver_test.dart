import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const MarketStatusResolver resolver = MarketStatusResolver();

  group('MarketStatusResolver', () {
    test('weekday during regular hours is open', () {
      // Wednesday 10:00 AM
      final DateTime now = DateTime(2024, 6, 12, 10, 0);
      expect(resolver.resolve(now), SessionPhase.regular);
      expect(resolver.isOpen(now), isTrue);
      expect(resolver.isClosed(now), isFalse);
    });

    test('weekday pre-market', () {
      // Wednesday 5:00 AM
      final DateTime now = DateTime(2024, 6, 12, 5, 0);
      expect(resolver.resolve(now), SessionPhase.preMarket);
      expect(resolver.isExtended(now), isTrue);
    });

    test('weekday after-hours', () {
      // Wednesday 5:00 PM
      final DateTime now = DateTime(2024, 6, 12, 17, 0);
      expect(resolver.resolve(now), SessionPhase.afterHours);
      expect(resolver.isExtended(now), isTrue);
    });

    test('saturday is closed', () {
      // Saturday 12:00 PM
      final DateTime now = DateTime(2024, 6, 15, 12, 0);
      expect(resolver.resolve(now), SessionPhase.closed);
      expect(resolver.isClosed(now), isTrue);
    });

    test('sunday is closed', () {
      // Sunday 10:00 AM
      final DateTime now = DateTime(2024, 6, 16, 10, 0);
      expect(resolver.resolve(now), SessionPhase.closed);
    });

    test('holiday is closed', () {
      // Weekday but holiday
      final DateTime now = DateTime(2024, 7, 4, 10, 0);
      expect(resolver.resolve(now, isHoliday: true), SessionPhase.closed);
    });

    test('weekday late night is closed', () {
      // Wednesday 11:00 PM (past after-hours close of 8PM)
      final DateTime now = DateTime(2024, 6, 12, 23, 0);
      expect(resolver.resolve(now), SessionPhase.closed);
    });

    test('weekday early morning before pre-market is closed', () {
      // Wednesday 2:00 AM (before pre-market open of 4AM)
      final DateTime now = DateTime(2024, 6, 12, 2, 0);
      expect(resolver.resolve(now), SessionPhase.closed);
    });
  });
}
