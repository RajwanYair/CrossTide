import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('AlertSuppressRule', () {
    const AlertSuppressRule nightRule = AlertSuppressRule(
      id: 'r1',
      label: 'Night quiet hours',
      startHour: 22,
      endHour: 7,
      reason: SuppressReason.quietHours,
    );

    const AlertSuppressRule dayRule = AlertSuppressRule(
      id: 'r2',
      label: 'Midday break',
      startHour: 12,
      endHour: 13,
      reason: SuppressReason.userMuted,
    );

    test('overnight rule applies at midnight', () {
      expect(nightRule.appliesAt(DateTime(2025, 1, 1, 0, 30)), isTrue);
    });

    test('overnight rule applies at 23:00', () {
      expect(nightRule.appliesAt(DateTime(2025, 1, 1, 23, 0)), isTrue);
    });

    test('overnight rule does not apply at noon', () {
      expect(nightRule.appliesAt(DateTime(2025, 1, 1, 12, 0)), isFalse);
    });

    test('day rule applies within window', () {
      expect(dayRule.appliesAt(DateTime(2025, 1, 1, 12, 30)), isTrue);
    });

    test('day rule does not apply outside window', () {
      expect(dayRule.appliesAt(DateTime(2025, 1, 1, 11, 59)), isFalse);
    });

    test('inactive rule never applies', () {
      final AlertSuppressRule inactive = dayRule.deactivate();
      expect(inactive.appliesAt(DateTime(2025, 1, 1, 12, 30)), isFalse);
    });

    test('activate re-enables rule', () {
      final AlertSuppressRule reactivated = dayRule.deactivate().activate();
      expect(reactivated.isActive, isTrue);
    });

    test('coversWeekend false for default Mon–Fri only rule', () {
      const AlertSuppressRule weekdayOnly = AlertSuppressRule(
        id: 'r3',
        label: 'Weekday only',
        startHour: 9,
        endHour: 17,
        reason: SuppressReason.marketClosed,
        daysOfWeek: [1, 2, 3, 4, 5],
      );
      expect(weekdayOnly.coversWeekend, isFalse);
      expect(weekdayOnly.coversWeekdays, isTrue);
    });

    test('equality', () {
      const AlertSuppressRule same = AlertSuppressRule(
        id: 'r1',
        label: 'Night quiet hours',
        startHour: 22,
        endHour: 7,
        reason: SuppressReason.quietHours,
      );
      expect(nightRule, same);
    });
  });
}
