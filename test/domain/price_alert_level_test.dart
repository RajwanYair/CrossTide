import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('PriceAlertLevel', () {
    const PriceAlertLevel alert = PriceAlertLevel(
      id: 'a1',
      symbol: 'AAPL',
      targetPrice: 200.0,
      direction: PriceAlertDirection.above,
    );

    test('isPending by default', () {
      expect(alert.isPending, isTrue);
    });

    test('wouldTrigger above', () {
      expect(alert.wouldTrigger(195.0, 201.0), isTrue);
      expect(alert.wouldTrigger(195.0, 199.0), isFalse);
    });

    test('wouldTrigger below', () {
      const PriceAlertLevel below = PriceAlertLevel(
        id: 'a2',
        symbol: 'AAPL',
        targetPrice: 150.0,
        direction: PriceAlertDirection.below,
      );
      expect(below.wouldTrigger(160.0, 149.0), isTrue);
      expect(below.wouldTrigger(160.0, 151.0), isFalse);
    });

    test('wouldTrigger crossUp', () {
      const PriceAlertLevel crossUp = PriceAlertLevel(
        id: 'a3',
        symbol: 'MSFT',
        targetPrice: 300.0,
        direction: PriceAlertDirection.crossUp,
      );
      expect(crossUp.wouldTrigger(299.0, 301.0), isTrue);
      expect(crossUp.wouldTrigger(300.0, 302.0), isFalse);
    });

    test('wouldTrigger crossDown', () {
      const PriceAlertLevel crossDown = PriceAlertLevel(
        id: 'a4',
        symbol: 'TSLA',
        targetPrice: 250.0,
        direction: PriceAlertDirection.crossDown,
      );
      expect(crossDown.wouldTrigger(251.0, 249.0), isTrue);
      expect(crossDown.wouldTrigger(248.0, 246.0), isFalse);
    });

    test('trigger sets status', () {
      final PriceAlertLevel triggered = alert.trigger();
      expect(triggered.isTriggered, isTrue);
      expect(alert.isPending, isTrue);
    });

    test('dismiss sets status to dismissed', () {
      final PriceAlertLevel dismissed = alert.dismiss();
      expect(dismissed.status, PriceAlertStatus.dismissed);
    });

    test('isExpiredAt returns true when past expiry', () {
      final PriceAlertLevel expiring = PriceAlertLevel(
        id: 'a5',
        symbol: 'AAPL',
        targetPrice: 200.0,
        direction: PriceAlertDirection.above,
        expiresAt: DateTime(2025, 1, 1),
      );
      expect(expiring.isExpiredAt(DateTime(2025, 1, 2)), isTrue);
      expect(expiring.isExpiredAt(DateTime(2024, 12, 31)), isFalse);
    });

    test('equality', () {
      const PriceAlertLevel same = PriceAlertLevel(
        id: 'a1',
        symbol: 'AAPL',
        targetPrice: 200.0,
        direction: PriceAlertDirection.above,
      );
      expect(alert, same);
    });
  });
}
