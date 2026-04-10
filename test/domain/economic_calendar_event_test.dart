import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('EconomicCalendarEvent', () {
    final EconomicCalendarEvent released = EconomicCalendarEvent(
      id: 'cpi-2025-01',
      title: 'CPI MoM',
      category: EconomicEventCategory.inflation,
      impactLevel: EconomicImpactLevel.high,
      scheduledAt: DateTime(2025, 1, 15, 8, 30),
      actualValue: 0.3,
      forecastValue: 0.2,
      previousValue: 0.1,
    );

    final EconomicCalendarEvent pending = EconomicCalendarEvent(
      id: 'nfp-2025-02',
      title: 'Non-Farm Payrolls',
      category: EconomicEventCategory.employment,
      impactLevel: EconomicImpactLevel.high,
      scheduledAt: DateTime(2025, 2, 7, 8, 30),
    );

    test('isReleased true when actualValue set', () {
      expect(released.isReleased, isTrue);
    });

    test('isDue true when not released', () {
      expect(pending.isDue, isTrue);
    });

    test('isHighImpact true', () {
      expect(released.isHighImpact, isTrue);
    });

    test('surprise computes actual - forecast', () {
      expect(released.surprise, closeTo(0.1, 0.0001));
    });

    test('isPositiveSurprise true when actual > forecast', () {
      expect(released.isPositiveSurprise, isTrue);
    });

    test('surprise null when forecast missing', () {
      expect(pending.surprise, isNull);
    });

    test('defaults to USD and US', () {
      expect(released.currency, 'USD');
      expect(released.country, 'US');
    });

    test('equality', () {
      final EconomicCalendarEvent same = EconomicCalendarEvent(
        id: 'cpi-2025-01',
        title: 'CPI MoM',
        category: EconomicEventCategory.inflation,
        impactLevel: EconomicImpactLevel.high,
        scheduledAt: DateTime(2025, 1, 15, 8, 30),
        actualValue: 0.3,
        forecastValue: 0.2,
        previousValue: 0.1,
      );
      expect(released, same);
    });
  });
}
