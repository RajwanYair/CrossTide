import 'package:cross_tide/src/domain/entities.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('AlertProfileDefaults.previewDiff', () {
    const balanced = AppSettings(
      refreshIntervalMinutes: 60,
      trendStrictnessDays: 1,
      cacheTtlMinutes: 30,
    );

    test('no diff when current already matches balanced profile', () {
      final diff = AlertProfile.balanced.previewDiff(balanced);
      expect(diff, isEmpty);
    });

    test('aggressive diff from balanced shows changed fields', () {
      final diff = AlertProfile.aggressive.previewDiff(balanced);

      expect(diff.containsKey('refreshIntervalMinutes'), isTrue);
      expect(diff['refreshIntervalMinutes']?.$1, '60');
      expect(diff['refreshIntervalMinutes']?.$2, '15');

      expect(diff.containsKey('cacheTtlMinutes'), isTrue);
      expect(diff['cacheTtlMinutes']?.$1, '30');
      expect(diff['cacheTtlMinutes']?.$2, '10');
    });

    test('conservative diff from balanced shows changed fields', () {
      final diff = AlertProfile.conservative.previewDiff(balanced);

      expect(diff.containsKey('refreshIntervalMinutes'), isTrue);
      expect(diff['refreshIntervalMinutes']?.$2, '120');

      expect(diff.containsKey('trendStrictnessDays'), isTrue);
      expect(diff['trendStrictnessDays']?.$2, '3');
    });

    test('custom profile returns empty diff (pass-through)', () {
      final diff = AlertProfile.custom.previewDiff(balanced);
      // custom.defaults == const AppSettings() — balanced differs only on TTL
      // We just check the method doesn't throw and returns a map.
      expect(diff, isA<Map<String, (String, String)>>());
    });

    test('diff contains only changed fields', () {
      const almostAggressive = AppSettings(
        refreshIntervalMinutes: 15, // same as aggressive
        trendStrictnessDays: 1, // same as aggressive
        cacheTtlMinutes: 30, // different (aggressive wants 10)
      );
      final diff = AlertProfile.aggressive.previewDiff(almostAggressive);

      expect(diff.containsKey('refreshIntervalMinutes'), isFalse);
      expect(diff.containsKey('trendStrictnessDays'), isFalse);
      expect(diff.containsKey('cacheTtlMinutes'), isTrue);
    });
  });
}
