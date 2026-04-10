import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('AlertCooldownConfig', () {
    test('balanced preset values', () {
      expect(
        AlertCooldownConfig.balanced.cooldownDuration,
        const Duration(hours: 1),
      );
      expect(AlertCooldownConfig.balanced.scope, CooldownScope.perTicker);
      expect(AlertCooldownConfig.balanced.maxAlertsPerWindow, 5);
    });

    test('aggressive preset has shorter cooldown', () {
      expect(
        AlertCooldownConfig.aggressive.cooldownDuration,
        lessThan(AlertCooldownConfig.balanced.cooldownDuration),
      );
    });

    test('conservative preset has longer cooldown', () {
      expect(
        AlertCooldownConfig.conservative.cooldownDuration,
        greaterThan(AlertCooldownConfig.balanced.cooldownDuration),
      );
    });

    test('isWindowExhausted returns true when count >= max', () {
      expect(AlertCooldownConfig.balanced.isWindowExhausted(5), isTrue);
      expect(AlertCooldownConfig.balanced.isWindowExhausted(4), isFalse);
    });

    test('isInCooldown true within duration', () {
      expect(
        AlertCooldownConfig.balanced.isInCooldown(const Duration(minutes: 30)),
        isTrue,
      );
    });

    test('isInCooldown false after cooldown expires', () {
      expect(
        AlertCooldownConfig.balanced.isInCooldown(const Duration(hours: 2)),
        isFalse,
      );
    });

    test('withCooldown returns immutable copy', () {
      final AlertCooldownConfig modified = AlertCooldownConfig.balanced
          .withCooldown(const Duration(hours: 4));
      expect(modified.cooldownDuration, const Duration(hours: 4));
      expect(
        AlertCooldownConfig.balanced.cooldownDuration,
        const Duration(hours: 1),
      );
    });

    test('equality', () {
      const AlertCooldownConfig a = AlertCooldownConfig(
        cooldownDuration: Duration(hours: 1),
        scope: CooldownScope.perTicker,
      );
      const AlertCooldownConfig b = AlertCooldownConfig(
        cooldownDuration: Duration(hours: 1),
        scope: CooldownScope.perTicker,
      );
      expect(a, b);
    });
  });
}
