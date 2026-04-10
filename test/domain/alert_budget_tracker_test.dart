import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('AlertBudgetTracker', () {
    AlertBudgetTracker buildTracker({
      int dailyLimit = 10,
      int weeklyLimit = 50,
      int alertsToday = 5,
      int alertsThisWeek = 20,
    }) {
      return AlertBudgetTracker(
        trackerId: 't1',
        ticker: 'AAPL',
        dailyLimit: dailyLimit,
        weeklyLimit: weeklyLimit,
        alertsToday: alertsToday,
        alertsThisWeek: alertsThisWeek,
        resetAt: DateTime(2024, 6, 2),
      );
    }

    test('isDailyExhausted is true when alertsToday >= dailyLimit', () {
      expect(buildTracker(alertsToday: 10).isDailyExhausted, isTrue);
    });

    test('isDailyExhausted is false when alertsToday < dailyLimit', () {
      expect(buildTracker(alertsToday: 9).isDailyExhausted, isFalse);
    });

    test('isDailyExhausted is false when dailyLimit is 0 (unlimited)', () {
      expect(buildTracker(dailyLimit: 0).isDailyExhausted, isFalse);
    });

    test('isWeeklyExhausted is true when alertsThisWeek >= weeklyLimit', () {
      expect(buildTracker(alertsThisWeek: 50).isWeeklyExhausted, isTrue);
    });

    test('isExhausted is false when neither limit is reached', () {
      expect(buildTracker().isExhausted, isFalse);
    });

    test('isExhausted is true when daily is exhausted', () {
      expect(buildTracker(alertsToday: 10).isExhausted, isTrue);
    });

    test('remainingToday returns correct count', () {
      expect(buildTracker(alertsToday: 6).remainingToday, 4);
    });

    test('remainingToday returns null when dailyLimit is 0', () {
      expect(buildTracker(dailyLimit: 0).remainingToday, isNull);
    });

    test('remainingToday clamps to 0 when over limit', () {
      expect(buildTracker(alertsToday: 12).remainingToday, 0);
    });

    test('equality holds for same props', () {
      expect(buildTracker(), equals(buildTracker()));
    });
  });
}
