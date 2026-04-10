import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('FeatureAccessScope', () {
    test('has 5 values', () {
      expect(FeatureAccessScope.values.length, 5);
    });
  });

  group('FeatureAccessPolicy', () {
    test('isFree is true when scope is free and isEnabled is true', () {
      const p = FeatureAccessPolicy(
        featureKey: 'dark_mode',
        scope: FeatureAccessScope.free,
      );
      expect(p.isFree, isTrue);
    });

    test('isFree is false when disabled', () {
      const p = FeatureAccessPolicy(
        featureKey: 'dark_mode',
        scope: FeatureAccessScope.free,
        isEnabled: false,
      );
      expect(p.isFree, isFalse);
    });

    test('isFlagGated is true when scope is flagGated', () {
      const p = FeatureAccessPolicy(
        featureKey: 'beta_charts',
        scope: FeatureAccessScope.flagGated,
        requiredFlagKey: 'enable_beta_charts',
      );
      expect(p.isFlagGated, isTrue);
    });

    test('isEnabled defaults to true', () {
      const p = FeatureAccessPolicy(
        featureKey: 'export',
        scope: FeatureAccessScope.subscriber,
      );
      expect(p.isEnabled, isTrue);
    });

    test('equality holds for same props', () {
      const a = FeatureAccessPolicy(
        featureKey: 'export',
        scope: FeatureAccessScope.premium,
        minimumTierName: 'gold',
      );
      const b = FeatureAccessPolicy(
        featureKey: 'export',
        scope: FeatureAccessScope.premium,
        minimumTierName: 'gold',
      );
      expect(a, equals(b));
    });
  });
}
