import 'package:cross_tide/src/domain/alert_channel_metrics.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('AlertChannelMetrics', () {
    test('equality', () {
      final a = AlertChannelMetrics(
        channelName: 'push',
        sentCount: 100,
        deliveredCount: 95,
        failedCount: 5,
        averageDeliveryMs: 250.0,
        periodStart: DateTime(2025, 1, 1),
        periodEnd: DateTime(2025, 1, 31),
      );
      final b = AlertChannelMetrics(
        channelName: 'push',
        sentCount: 100,
        deliveredCount: 95,
        failedCount: 5,
        averageDeliveryMs: 250.0,
        periodStart: DateTime(2025, 1, 1),
        periodEnd: DateTime(2025, 1, 31),
      );
      expect(a, b);
    });

    test('copyWith changes sentCount', () {
      final base = AlertChannelMetrics(
        channelName: 'push',
        sentCount: 100,
        deliveredCount: 95,
        failedCount: 5,
        averageDeliveryMs: 250.0,
        periodStart: DateTime(2025, 1, 1),
        periodEnd: DateTime(2025, 1, 31),
      );
      final updated = base.copyWith(sentCount: 120);
      expect(updated.sentCount, 120);
    });

    test('props length is 7', () {
      final obj = AlertChannelMetrics(
        channelName: 'push',
        sentCount: 100,
        deliveredCount: 95,
        failedCount: 5,
        averageDeliveryMs: 250.0,
        periodStart: DateTime(2025, 1, 1),
        periodEnd: DateTime(2025, 1, 31),
      );
      expect(obj.props.length, 7);
    });
  });
}
