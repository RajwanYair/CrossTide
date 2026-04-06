import 'package:cross_tide/src/domain/entities.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('AlertSensitivityStats.fromHistory', () {
    AlertHistoryEntry entry(
      DateTime firedAt, {
      String type = 'sma200CrossUp',
    }) => AlertHistoryEntry(
      symbol: 'AAPL',
      alertType: type,
      message: 'test',
      firedAt: firedAt,
    );

    test('empty history returns zero stats', () {
      final s = AlertSensitivityStats.fromHistory('AAPL', []);
      expect(s.totalAlerts, 0);
      expect(s.firstFiredAt, isNull);
      expect(s.lastFiredAt, isNull);
      expect(s.avgDaysBetweenAlerts, isNull);
      expect(s.alertsByType, isEmpty);
    });

    test('single entry has no average', () {
      final s = AlertSensitivityStats.fromHistory('AAPL', [
        entry(DateTime(2024, 1, 10)),
      ]);
      expect(s.totalAlerts, 1);
      expect(s.firstFiredAt, DateTime(2024, 1, 10));
      expect(s.lastFiredAt, DateTime(2024, 1, 10));
      expect(s.avgDaysBetweenAlerts, isNull);
    });

    test('two entries compute average gap', () {
      final s = AlertSensitivityStats.fromHistory('AAPL', [
        entry(DateTime(2024, 1, 10)),
        entry(DateTime(2024, 1, 20)),
      ]);
      expect(s.totalAlerts, 2);
      expect(s.avgDaysBetweenAlerts, closeTo(10.0, 0.01));
    });

    test('counts by type', () {
      final s = AlertSensitivityStats.fromHistory('AAPL', [
        entry(DateTime(2024, 1, 1), type: 'sma200CrossUp'),
        entry(DateTime(2024, 1, 10), type: 'goldenCross'),
        entry(DateTime(2024, 1, 20), type: 'sma200CrossUp'),
      ]);
      expect(s.alertsByType['sma200CrossUp'], 2);
      expect(s.alertsByType['goldenCross'], 1);
    });

    test('sorts entries by date regardless of input order', () {
      final s = AlertSensitivityStats.fromHistory('AAPL', [
        entry(DateTime(2024, 1, 20)),
        entry(DateTime(2024, 1, 5)),
        entry(DateTime(2024, 1, 10)),
      ]);
      expect(s.firstFiredAt, DateTime(2024, 1, 5));
      expect(s.lastFiredAt, DateTime(2024, 1, 20));
    });

    test('props length is 6', () {
      final s = AlertSensitivityStats.fromHistory('AAPL', []);
      expect(s.props.length, 6);
    });
  });
}
