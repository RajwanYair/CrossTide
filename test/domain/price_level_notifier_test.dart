import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const notifier = PriceLevelNotifier();

  group('PriceLevelNotifier', () {
    test('detects round number crossings up', () {
      final crossings = notifier.detectRoundNumbers(
        ticker: 'AAPL',
        previousClose: 148,
        currentClose: 152,
        increment: 10,
      );

      expect(crossings, hasLength(1));
      expect(crossings[0].level.price, 150);
      expect(crossings[0].crossedAbove, isTrue);
    });

    test('detects round number crossings down', () {
      final crossings = notifier.detectRoundNumbers(
        ticker: 'AAPL',
        previousClose: 152,
        currentClose: 148,
        increment: 10,
      );

      expect(crossings, hasLength(1));
      expect(crossings[0].crossedAbove, isFalse);
    });

    test('no crossing when price stays in range', () {
      final crossings = notifier.detectRoundNumbers(
        ticker: 'AAPL',
        previousClose: 151,
        currentClose: 153,
        increment: 10,
      );
      expect(crossings, isEmpty);
    });

    test('detects custom level crossing above', () {
      const level = PriceLevel(
        type: PriceLevelType.previousHigh,
        price: 200,
        label: 'All-time high',
      );

      final crossings = notifier.detectCustomLevels(
        ticker: 'MSFT',
        previousClose: 199,
        currentClose: 201,
        levels: [level],
      );

      expect(crossings, hasLength(1));
      expect(crossings[0].crossedAbove, isTrue);
      expect(crossings[0].level.label, 'All-time high');
    });

    test('detects custom level crossing below', () {
      const level = PriceLevel(
        type: PriceLevelType.custom,
        price: 100,
        label: 'Support',
      );

      final crossings = notifier.detectCustomLevels(
        ticker: 'GOOG',
        previousClose: 101,
        currentClose: 99,
        levels: [level],
      );

      expect(crossings, hasLength(1));
      expect(crossings[0].crossedAbove, isFalse);
    });
  });
}
