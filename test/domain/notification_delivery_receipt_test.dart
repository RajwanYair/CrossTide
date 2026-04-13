import 'package:cross_tide/src/domain/notification_delivery_receipt.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('NotificationDeliveryReceipt', () {
    test('equality', () {
      final a = NotificationDeliveryReceipt(
        alertId: 'alert-1',
        channel: 'push',
        outcome: NotificationDeliveryOutcome.delivered,
        attemptCount: 1,
        deliveredAt: DateTime(2025, 1, 1),
      );
      final b = NotificationDeliveryReceipt(
        alertId: 'alert-1',
        channel: 'push',
        outcome: NotificationDeliveryOutcome.delivered,
        attemptCount: 1,
        deliveredAt: DateTime(2025, 1, 1),
      );
      expect(a, b);
    });

    test('copyWith changes attemptCount', () {
      final base = NotificationDeliveryReceipt(
        alertId: 'alert-1',
        channel: 'push',
        outcome: NotificationDeliveryOutcome.delivered,
        attemptCount: 1,
        deliveredAt: DateTime(2025, 1, 1),
      );
      final updated = base.copyWith(attemptCount: 2);
      expect(updated.attemptCount, 2);
    });

    test('props length is 5', () {
      final obj = NotificationDeliveryReceipt(
        alertId: 'alert-1',
        channel: 'push',
        outcome: NotificationDeliveryOutcome.delivered,
        attemptCount: 1,
        deliveredAt: DateTime(2025, 1, 1),
      );
      expect(obj.props.length, 5);
    });
  });
}
