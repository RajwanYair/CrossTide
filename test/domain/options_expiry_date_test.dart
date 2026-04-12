import 'package:cross_tide/src/domain/options_expiry_date.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('OptionsExpiryDate', () {
    test('equality', () {
      final a = OptionsExpiryDate(
        ticker: 'SPY',
        expiryDate: DateTime(2025, 3, 21),
        style: OptionsExpiryStyle.monthly,
        daysToExpiry: 30,
      );
      final b = OptionsExpiryDate(
        ticker: 'SPY',
        expiryDate: DateTime(2025, 3, 21),
        style: OptionsExpiryStyle.monthly,
        daysToExpiry: 30,
      );
      expect(a, b);
    });

    test('copyWith changes daysToExpiry', () {
      final base = OptionsExpiryDate(
        ticker: 'SPY',
        expiryDate: DateTime(2025, 3, 21),
        style: OptionsExpiryStyle.monthly,
        daysToExpiry: 30,
      );
      final updated = base.copyWith(daysToExpiry: 7);
      expect(updated.daysToExpiry, 7);
    });

    test('props length is 6', () {
      final obj = OptionsExpiryDate(
        ticker: 'SPY',
        expiryDate: DateTime(2025, 3, 21),
        style: OptionsExpiryStyle.monthly,
        daysToExpiry: 30,
      );
      expect(obj.props.length, 6);
    });
  });
}
