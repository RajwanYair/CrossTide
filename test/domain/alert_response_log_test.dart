import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('AlertResponseLog', () {
    final dismissed = AlertResponseLog(
      responseId: 'r1',
      alertId: 'a1',
      ticker: 'AAPL',
      actionKey: 'dismiss',
      respondedAt: DateTime(2026, 4, 10),
      durationMs: 2500,
    );

    final engaged = AlertResponseLog(
      responseId: 'r2',
      alertId: 'a2',
      ticker: 'MSFT',
      actionKey: 'view_chart',
      respondedAt: DateTime(2026, 4, 10),
    );

    test('isDismissed returns true when actionKey is dismiss', () {
      expect(dismissed.isDismissed, isTrue);
    });

    test('isDismissed returns false for non-dismiss actions', () {
      expect(engaged.isDismissed, isFalse);
    });

    test('isEngaged returns true for non-dismiss actions', () {
      expect(engaged.isEngaged, isTrue);
    });

    test('isEngaged returns false when actionKey is dismiss', () {
      expect(dismissed.isEngaged, isFalse);
    });

    test('durationMs is available when tracked', () {
      expect(dismissed.durationMs, 2500);
    });

    test('durationMs is null when not tracked', () {
      expect(engaged.durationMs, isNull);
    });

    test('equality holds for same values', () {
      final a = AlertResponseLog(
        responseId: 'r1',
        alertId: 'a1',
        ticker: 'AAPL',
        actionKey: 'dismiss',
        respondedAt: DateTime(2026, 4, 10),
        durationMs: 2500,
      );
      final b = AlertResponseLog(
        responseId: 'r1',
        alertId: 'a1',
        ticker: 'AAPL',
        actionKey: 'dismiss',
        respondedAt: DateTime(2026, 4, 10),
        durationMs: 2500,
      );
      expect(a, equals(b));
    });

    test('buy_now action is engaged', () {
      final buyNow = AlertResponseLog(
        responseId: 'r3',
        alertId: 'a3',
        ticker: 'TSLA',
        actionKey: 'buy_now',
        respondedAt: DateTime(2026, 4, 10),
      );
      expect(buyNow.isEngaged, isTrue);
      expect(buyNow.isDismissed, isFalse);
    });
  });
}
