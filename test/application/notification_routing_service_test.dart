import 'package:cross_tide/src/application/notification_routing_service.dart';
import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const service = NotificationRoutingService();

  final statuses = [
    ChannelStatus(
      channel: NotificationChannelType.push,
      isAvailable: true,
      reliability: 0.95,
      lastSuccessAt: DateTime(2025, 4, 7),
      failureCount: 0,
    ),
    ChannelStatus(
      channel: NotificationChannelType.windowsToast,
      isAvailable: true,
      reliability: 0.85,
      lastSuccessAt: DateTime(2025, 4, 7),
      failureCount: 1,
    ),
    ChannelStatus(
      channel: NotificationChannelType.silentLog,
      isAvailable: true,
      reliability: 1.0,
      lastSuccessAt: DateTime(2025, 4, 7),
      failureCount: 0,
    ),
  ];

  test('selectChannel returns highest-ranked channel', () {
    final selected = service.selectChannel(statuses);
    expect(selected, isNotNull);
    expect(selected!.channel, isNotNull);
  });

  test('rankAll returns all channels ordered', () {
    final ranked = service.rankAll(statuses);
    expect(ranked.length, statuses.length);
    // Verify descending score order.
    for (var i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].score, greaterThanOrEqualTo(ranked[i].score));
    }
  });

  test('selectChannel returns null for empty statuses', () {
    expect(service.selectChannel([]), isNull);
  });
}
