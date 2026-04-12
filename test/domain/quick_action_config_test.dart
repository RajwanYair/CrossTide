import 'package:cross_tide/src/domain/quick_action_config.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('QuickActionConfig', () {
    test('equality', () {
      const a = QuickActionConfig(
        actionId: 'qa1',
        label: 'Add Ticker',
        iconAssetPath: 'assets/icons/add.png',
        deepLinkTarget: 'cross-tide://add-ticker',
        platform: QuickActionPlatform.android,
        displayOrder: 1,
      );
      const b = QuickActionConfig(
        actionId: 'qa1',
        label: 'Add Ticker',
        iconAssetPath: 'assets/icons/add.png',
        deepLinkTarget: 'cross-tide://add-ticker',
        platform: QuickActionPlatform.android,
        displayOrder: 1,
      );
      expect(a, b);
    });

    test('copyWith changes label', () {
      const base = QuickActionConfig(
        actionId: 'qa1',
        label: 'Add Ticker',
        iconAssetPath: 'assets/icons/add.png',
        deepLinkTarget: 'cross-tide://add-ticker',
        platform: QuickActionPlatform.android,
        displayOrder: 1,
      );
      final updated = base.copyWith(label: 'Search');
      expect(updated.label, 'Search');
    });

    test('props length is 8', () {
      const obj = QuickActionConfig(
        actionId: 'qa1',
        label: 'Add Ticker',
        iconAssetPath: 'assets/icons/add.png',
        deepLinkTarget: 'cross-tide://add-ticker',
        platform: QuickActionPlatform.android,
        displayOrder: 1,
      );
      expect(obj.props.length, 8);
    });
  });
}
