import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('AlertDeliveryWindow', () {
    test('containsMinute returns true for standard range', () {
      const window = AlertDeliveryWindow.businessHours;
      expect(window.containsMinute(600), isTrue); // 10:00
      expect(window.containsMinute(1020), isTrue); // 17:00 (boundary)
      expect(window.containsMinute(1021), isFalse); // after end
      expect(window.containsMinute(539), isFalse); // before start
    });

    test('containsMinute wraps midnight for overnight window', () {
      const window = AlertDeliveryWindow.overnightQuiet;
      // overnightQuiet: 22:00 (1320) to 07:00 (420)
      expect(window.containsMinute(1350), isTrue); // 22:30
      expect(window.containsMinute(60), isTrue); // 01:00
      expect(window.containsMinute(420), isTrue); // 07:00 boundary
      expect(window.containsMinute(800), isFalse); // 13:20 outside
    });

    test('static businessHours preset has expected fields', () {
      const window = AlertDeliveryWindow.businessHours;
      expect(window.windowType, equals(DeliveryWindowType.activeHours));
      expect(window.startMinuteOfDay, equals(540));
      expect(window.endMinuteOfDay, equals(1020));
      expect(window.activeDaysOfWeek, equals({1, 2, 3, 4, 5}));
    });

    test('static overnightQuiet preset has expected fields', () {
      const window = AlertDeliveryWindow.overnightQuiet;
      expect(window.windowType, equals(DeliveryWindowType.quietHours));
    });

    test('equality holds for same props', () {
      const a = AlertDeliveryWindow(
        windowType: DeliveryWindowType.custom,
        startMinuteOfDay: 480,
        endMinuteOfDay: 960,
        activeDaysOfWeek: {1, 2},
        label: 'test',
      );
      const b = AlertDeliveryWindow(
        windowType: DeliveryWindowType.custom,
        startMinuteOfDay: 480,
        endMinuteOfDay: 960,
        activeDaysOfWeek: {1, 2},
        label: 'test',
      );
      expect(a, equals(b));
    });
  });
}
