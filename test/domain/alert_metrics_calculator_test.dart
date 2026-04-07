import 'package:cross_tide/src/domain/alert_metrics_calculator.dart';
import 'package:cross_tide/src/domain/entities.dart';
import 'package:flutter_test/flutter_test.dart';

AlertHistoryEntry _entry(
  String symbol, {
  required DateTime firedAt,
  String alertType = 'sma200CrossUp',
}) => AlertHistoryEntry(
  symbol: symbol,
  alertType: alertType,
  message: 'Test alert for $symbol',
  firedAt: firedAt,
);

void main() {
  const calc = AlertMetricsCalculator();

  group('AlertMetricsCalculator', () {
    test('returns empty list for empty history', () {
      expect(calc.compute([]), isEmpty);
    });

    test('single entry produces alertCount=1, no meanDaysBetweenAlerts', () {
      final entries = [_entry('AAPL', firedAt: DateTime(2024, 1, 10))];
      final results = calc.compute(entries);
      expect(results, hasLength(1));
      expect(results[0].symbol, 'AAPL');
      expect(results[0].alertCount, 1);
      expect(results[0].meanDaysBetweenAlerts, isNull);
      expect(results[0].firstAlertAt, DateTime(2024, 1, 10));
      expect(results[0].lastAlertAt, DateTime(2024, 1, 10));
    });

    test('two entries: meanDaysBetweenAlerts equals their gap in days', () {
      final entries = [
        _entry('MSFT', firedAt: DateTime(2024, 1, 1)),
        _entry('MSFT', firedAt: DateTime(2024, 1, 11)),
      ];
      final results = calc.compute(entries);
      expect(results[0].alertCount, 2);
      expect(results[0].meanDaysBetweenAlerts, closeTo(10.0, 0.001));
    });

    test('three entries: mean is average of two intervals', () {
      final entries = [
        _entry('TSLA', firedAt: DateTime(2024, 1, 1)),
        _entry('TSLA', firedAt: DateTime(2024, 1, 5)), // +4d
        _entry('TSLA', firedAt: DateTime(2024, 1, 11)), // +6d
      ];
      final results = calc.compute(entries);
      // Mean of 4 and 6 = 5
      expect(results[0].meanDaysBetweenAlerts, closeTo(5.0, 0.001));
    });

    test('multiple symbols: each gets its own AlertMetrics', () {
      final entries = [
        _entry('AAPL', firedAt: DateTime(2024, 1, 1)),
        _entry('AAPL', firedAt: DateTime(2024, 1, 6)), // 5d gap
        _entry('GOOG', firedAt: DateTime(2024, 1, 1)),
      ];
      final results = calc.compute(entries);
      expect(results, hasLength(2));
      final aapl = results.firstWhere((m) => m.symbol == 'AAPL');
      final goog = results.firstWhere((m) => m.symbol == 'GOOG');
      expect(aapl.alertCount, 2);
      expect(goog.alertCount, 1);
      expect(goog.meanDaysBetweenAlerts, isNull);
    });

    test('sorted by alertCount descending, then symbol alphabetically', () {
      final entries = [
        _entry('Z', firedAt: DateTime(2024, 1, 1)),
        _entry('A', firedAt: DateTime(2024, 1, 1)),
        _entry('A', firedAt: DateTime(2024, 1, 5)),
        _entry('A', firedAt: DateTime(2024, 1, 10)),
      ];
      final results = calc.compute(entries);
      expect(results[0].symbol, 'A'); // 3 alerts
      expect(results[1].symbol, 'Z'); // 1 alert
    });

    test('input need not be pre-sorted by date', () {
      final entries = [
        _entry('X', firedAt: DateTime(2024, 2, 1)),
        _entry('X', firedAt: DateTime(2024, 1, 1)), // earlier
      ];
      final results = calc.compute(entries);
      expect(results[0].firstAlertAt, DateTime(2024, 1, 1));
      expect(results[0].lastAlertAt, DateTime(2024, 2, 1));
      expect(results[0].meanDaysBetweenAlerts, closeTo(31.0, 0.01));
    });
  });

  group('AlertMetrics equality', () {
    test('same values are equal', () {
      final a = AlertMetrics(
        symbol: 'AAPL',
        alertCount: 3,
        firstAlertAt: DateTime(2024, 1, 1),
        lastAlertAt: DateTime(2024, 1, 10),
        meanDaysBetweenAlerts: 4.5,
      );
      final b = AlertMetrics(
        symbol: 'AAPL',
        alertCount: 3,
        firstAlertAt: DateTime(2024, 1, 1),
        lastAlertAt: DateTime(2024, 1, 10),
        meanDaysBetweenAlerts: 4.5,
      );
      expect(a, equals(b));
      expect(a.hashCode, equals(b.hashCode));
    });

    test('different alertCount is not equal', () {
      const a = AlertMetrics(symbol: 'X', alertCount: 1);
      const b = AlertMetrics(symbol: 'X', alertCount: 2);
      expect(a, isNot(equals(b)));
    });
  });
}
