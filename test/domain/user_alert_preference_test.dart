import 'package:cross_tide/src/domain/user_alert_preference.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('UserAlertPreference', () {
    test('equality', () {
      const a = UserAlertPreference(
        userId: 'u1',
        enablePushNotifications: true,
        enableInAppBanner: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        maxAlertsPerDay: 20,
      );
      const b = UserAlertPreference(
        userId: 'u1',
        enablePushNotifications: true,
        enableInAppBanner: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        maxAlertsPerDay: 20,
      );
      expect(a, b);
    });

    test('copyWith changes maxAlertsPerDay', () {
      const base = UserAlertPreference(
        userId: 'u1',
        enablePushNotifications: true,
        enableInAppBanner: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        maxAlertsPerDay: 20,
      );
      final updated = base.copyWith(maxAlertsPerDay: 10);
      expect(updated.maxAlertsPerDay, 10);
    });

    test('props length is 7', () {
      const obj = UserAlertPreference(
        userId: 'u1',
        enablePushNotifications: true,
        enableInAppBanner: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        maxAlertsPerDay: 20,
      );
      expect(obj.props.length, 7);
    });
  });
}
