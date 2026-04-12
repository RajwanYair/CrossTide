import 'package:cross_tide/src/domain/feature_flag_override.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('FeatureFlagOverride', () {
    test('equality', () {
      final a = FeatureFlagOverride(
        flagKey: 'new_chart_ui',
        overrideValue: true,
        overriddenBy: 'qa',
        createdAt: DateTime(2025, 10, 1),
      );
      final b = FeatureFlagOverride(
        flagKey: 'new_chart_ui',
        overrideValue: true,
        overriddenBy: 'qa',
        createdAt: DateTime(2025, 10, 1),
      );
      expect(a, b);
    });

    test('copyWith changes overriddenBy', () {
      final base = FeatureFlagOverride(
        flagKey: 'new_chart_ui',
        overrideValue: true,
        overriddenBy: 'qa',
        createdAt: DateTime(2025, 10, 1),
      );
      final updated = base.copyWith(overriddenBy: 'developer');
      expect(updated.overriddenBy, 'developer');
    });

    test('props length is 6', () {
      final obj = FeatureFlagOverride(
        flagKey: 'new_chart_ui',
        overrideValue: true,
        overriddenBy: 'qa',
        createdAt: DateTime(2025, 10, 1),
      );
      expect(obj.props.length, 6);
    });
  });
}
