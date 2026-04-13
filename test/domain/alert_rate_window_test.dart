import 'package:cross_tide/src/domain/alert_rate_window.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('AlertThrottleWindow', () {
    test('equality', () {
      const a = AlertThrottleWindow(
        ticker: 'AAPL',
        method: 'Micho',
        maxAlerts: 3,
        windowSize: 1,
        windowUnit: AlertWindowUnit.hour,
      );
      const b = AlertThrottleWindow(
        ticker: 'AAPL',
        method: 'Micho',
        maxAlerts: 3,
        windowSize: 1,
        windowUnit: AlertWindowUnit.hour,
      );
      expect(a, b);
    });

    test('copyWith changes maxAlerts', () {
      const base = AlertThrottleWindow(
        ticker: 'AAPL',
        method: 'Micho',
        maxAlerts: 3,
        windowSize: 1,
        windowUnit: AlertWindowUnit.hour,
      );
      final updated = base.copyWith(maxAlerts: 5);
      expect(updated.maxAlerts, 5);
    });

    test('props length is 5', () {
      const obj = AlertThrottleWindow(
        ticker: 'AAPL',
        method: 'Micho',
        maxAlerts: 3,
        windowSize: 1,
        windowUnit: AlertWindowUnit.hour,
      );
      expect(obj.props.length, 5);
    });
  });
}
