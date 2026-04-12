import 'package:cross_tide/src/domain/app_locale_override.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('AppLocaleOverride', () {
    test('equality', () {
      final a = AppLocaleOverride(
        userId: 'u1',
        localeCode: 'en-US',
        numberFormatLocale: 'en-US',
        useSystemLocale: false,
        appliedAt: DateTime(2025, 11, 1),
      );
      final b = AppLocaleOverride(
        userId: 'u1',
        localeCode: 'en-US',
        numberFormatLocale: 'en-US',
        useSystemLocale: false,
        appliedAt: DateTime(2025, 11, 1),
      );
      expect(a, b);
    });

    test('copyWith changes localeCode', () {
      final base = AppLocaleOverride(
        userId: 'u1',
        localeCode: 'en-US',
        numberFormatLocale: 'en-US',
        useSystemLocale: false,
        appliedAt: DateTime(2025, 11, 1),
      );
      final updated = base.copyWith(localeCode: 'de-DE');
      expect(updated.localeCode, 'de-DE');
    });

    test('props length is 5', () {
      final obj = AppLocaleOverride(
        userId: 'u1',
        localeCode: 'en-US',
        numberFormatLocale: 'en-US',
        useSystemLocale: false,
        appliedAt: DateTime(2025, 11, 1),
      );
      expect(obj.props.length, 5);
    });
  });
}
