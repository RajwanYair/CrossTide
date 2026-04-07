import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

List<DailyCandle> _candles(List<double> prices) => [
  for (int i = 0; i < prices.length; i++)
    DailyCandle(
      date: DateTime(2024, 1, 1).add(Duration(days: i)),
      open: prices[i],
      high: prices[i] + 1,
      low: prices[i] - 1,
      close: prices[i],
      volume: 1000,
    ),
];

void main() {
  const calculator = PriceDistanceCalculator();

  group('PriceDistanceCalculator', () {
    test('const constructor', () {
      const PriceDistanceCalculator Function() create =
          PriceDistanceCalculator.new;
      expect(create(), isNotNull);
    });

    test('returns null for empty candles', () {
      expect(calculator.compute([], period: 20), isNull);
    });

    test('returns null for insufficient data', () {
      expect(calculator.compute(_candles([100, 110]), period: 50), isNull);
    });

    test('computes positive distance above SMA', () {
      // 25 candles at 100, then latest at 110
      final prices = [...List.filled(24, 100.0), 110.0];
      final result = calculator.compute(_candles(prices), period: 20);
      expect(result, isNotNull);
      expect(result!.distancePercent, greaterThan(0));
      expect(result.period, 20);
    });

    test('computes negative distance below SMA', () {
      final prices = [...List.filled(24, 100.0), 90.0];
      final result = calculator.compute(_candles(prices), period: 20);
      expect(result, isNotNull);
      expect(result!.distancePercent, lessThan(0));
    });

    test('computeMultiple returns results for valid periods', () {
      final candles = _candles(List.generate(250, (i) => 100.0 + i * 0.1));
      final results = calculator.computeMultiple(candles);
      expect(results.length, 5); // 20, 50, 100, 150, 200
    });

    test('equatable', () {
      final prices = [...List.filled(24, 100.0), 110.0];
      final r1 = calculator.compute(_candles(prices), period: 20);
      final r2 = calculator.compute(_candles(prices), period: 20);
      expect(r1, equals(r2));
    });
  });
}
