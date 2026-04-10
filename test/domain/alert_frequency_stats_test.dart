import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  final start = DateTime(2026, 4, 1);
  final end = DateTime(2026, 4, 8);

  group('AlertFrequencyStats', () {
    test('alertsPerDay divides by duration in days', () {
      final stats = AlertFrequencyStats(
        ticker: 'AAPL',
        period: AlertFrequencyPeriod.weekly,
        alertCount: 7,
        periodStart: start,
        periodEnd: end,
        buyAlertCount: 4,
        sellAlertCount: 3,
      );
      expect(stats.alertsPerDay, closeTo(1.0, 0.001));
    });

    test('buyRatio calculates correctly', () {
      final stats = AlertFrequencyStats(
        ticker: 'AAPL',
        period: AlertFrequencyPeriod.weekly,
        alertCount: 10,
        periodStart: start,
        periodEnd: end,
        buyAlertCount: 7,
        sellAlertCount: 3,
      );
      expect(stats.buyRatio, closeTo(0.7, 0.001));
      expect(stats.sellRatio, closeTo(0.3, 0.001));
    });

    test('isEmpty is true when alertCount is zero', () {
      final stats = AlertFrequencyStats(
        ticker: 'AAPL',
        period: AlertFrequencyPeriod.daily,
        alertCount: 0,
        periodStart: start,
        periodEnd: end,
      );
      expect(stats.isEmpty, isTrue);
    });

    test('alertsPerDay is 0 when period duration is zero days', () {
      final stats = AlertFrequencyStats(
        ticker: 'AAPL',
        period: AlertFrequencyPeriod.daily,
        alertCount: 5,
        periodStart: start,
        periodEnd: start,
      );
      expect(stats.alertsPerDay, equals(0));
    });

    test('buyRatio is 0 when alertCount is zero', () {
      final stats = AlertFrequencyStats(
        ticker: 'X',
        period: AlertFrequencyPeriod.monthly,
        alertCount: 0,
        periodStart: start,
        periodEnd: end,
      );
      expect(stats.buyRatio, equals(0));
      expect(stats.sellRatio, equals(0));
    });

    test('equality holds for same props', () {
      final a = AlertFrequencyStats(
        ticker: 'MSFT',
        period: AlertFrequencyPeriod.monthly,
        alertCount: 3,
        periodStart: start,
        periodEnd: end,
      );
      final b = AlertFrequencyStats(
        ticker: 'MSFT',
        period: AlertFrequencyPeriod.monthly,
        alertCount: 3,
        periodStart: start,
        periodEnd: end,
      );
      expect(a, equals(b));
    });
  });
}
