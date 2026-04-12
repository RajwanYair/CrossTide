import 'package:cross_tide/src/domain/short_interest_snapshot.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('ShortInterestSnapshot', () {
    test('equality', () {
      final a = ShortInterestSnapshot(
        ticker: 'GME',
        shortInterestShares: 50000000,
        floatShares: 200000000,
        shortPercentFloat: 25.0,
        daysTocover: 3.5,
        reportDate: DateTime(2025, 1, 15),
      );
      final b = ShortInterestSnapshot(
        ticker: 'GME',
        shortInterestShares: 50000000,
        floatShares: 200000000,
        shortPercentFloat: 25.0,
        daysTocover: 3.5,
        reportDate: DateTime(2025, 1, 15),
      );
      expect(a, b);
    });

    test('copyWith changes shortPercentFloat', () {
      final base = ShortInterestSnapshot(
        ticker: 'GME',
        shortInterestShares: 50000000,
        floatShares: 200000000,
        shortPercentFloat: 25.0,
        daysTocover: 3.5,
        reportDate: DateTime(2025, 1, 15),
      );
      final updated = base.copyWith(shortPercentFloat: 30.0);
      expect(updated.shortPercentFloat, 30.0);
    });

    test('props length is 7', () {
      final obj = ShortInterestSnapshot(
        ticker: 'GME',
        shortInterestShares: 50000000,
        floatShares: 200000000,
        shortPercentFloat: 25.0,
        daysTocover: 3.5,
        reportDate: DateTime(2025, 1, 15),
      );
      expect(obj.props.length, 7);
    });
  });
}
