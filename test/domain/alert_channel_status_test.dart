import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('AlertChannelStatus', () {
    final healthy = AlertChannelStatus(
      channel: AlertChannelType.push,
      isEnabled: true,
      lastTestedAt: DateTime(2026, 1, 1),
      consecutiveFailures: 0,
    );

    final degraded = AlertChannelStatus(
      channel: AlertChannelType.email,
      isEnabled: true,
      lastTestedAt: DateTime(2026, 1, 1),
      consecutiveFailures: 4,
      failureReason: 'SMTP timeout',
    );

    final disabled = AlertChannelStatus(
      channel: AlertChannelType.sms,
      isEnabled: false,
      lastTestedAt: DateTime(2026, 1, 1),
    );

    test('isHealthy returns true when enabled with zero failures', () {
      expect(healthy.isHealthy, isTrue);
    });

    test('isHealthy returns false when disabled', () {
      expect(disabled.isHealthy, isFalse);
    });

    test('isHealthy returns false when there are consecutive failures', () {
      final withFailure = AlertChannelStatus(
        channel: AlertChannelType.push,
        isEnabled: true,
        lastTestedAt: DateTime(2026, 1, 1),
        consecutiveFailures: 1,
      );
      expect(withFailure.isHealthy, isFalse);
    });

    test('isDegraded returns true when consecutive failures exceed 3', () {
      expect(degraded.isDegraded, isTrue);
    });

    test('isDegraded returns false when failures are 3 or fewer', () {
      final borderline = AlertChannelStatus(
        channel: AlertChannelType.push,
        isEnabled: true,
        lastTestedAt: DateTime(2026, 1, 1),
        consecutiveFailures: 3,
      );
      expect(borderline.isDegraded, isFalse);
    });

    test('failureReason is null when healthy', () {
      expect(healthy.failureReason, isNull);
    });

    test('failureReason is set when degraded', () {
      expect(degraded.failureReason, 'SMTP timeout');
    });

    test('equality holds for same values', () {
      final a = AlertChannelStatus(
        channel: AlertChannelType.push,
        isEnabled: true,
        lastTestedAt: DateTime(2026, 1, 1),
      );
      final b = AlertChannelStatus(
        channel: AlertChannelType.push,
        isEnabled: true,
        lastTestedAt: DateTime(2026, 1, 1),
      );
      expect(a, equals(b));
    });

    test('all AlertChannelType values are distinct', () {
      const types = AlertChannelType.values;
      expect(types.toSet().length, types.length);
    });
  });
}
