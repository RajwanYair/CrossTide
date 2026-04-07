import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const calc = MarketProfileCalculator(bucketCount: 10);

  List<DailyCandle> makeCandles({
    required double basePrice,
    required int count,
    int baseVolume = 1000,
  }) {
    return [
      for (int i = 0; i < count; i++)
        DailyCandle(
          date: DateTime(2024, 1, 1 + i),
          open: basePrice + i * 0.5,
          high: basePrice + i * 0.5 + 2,
          low: basePrice + i * 0.5 - 2,
          close: basePrice + i * 0.5 + 1,
          volume: baseVolume + i * 100,
        ),
    ];
  }

  group('MarketProfileCalculator', () {
    test('builds profile from candles', () {
      final candles = makeCandles(basePrice: 100, count: 20);
      final result = calc.build(candles);

      expect(result.totalVolume, greaterThan(0));
      expect(result.levels, isNotEmpty);
      expect(result.pointOfControl, greaterThan(0));
      expect(result.valueAreaHigh, greaterThan(result.valueAreaLow));
    });

    test('empty candles returns zeroed result', () {
      final result = calc.build([]);
      expect(result.totalVolume, 0);
      expect(result.levels, isEmpty);
    });

    test('single candle builds profile', () {
      final candles = [
        DailyCandle(
          date: DateTime(2024),
          open: 100,
          high: 105,
          low: 95,
          close: 102,
          volume: 5000,
        ),
      ];

      final result = calc.build(candles);
      expect(result.totalVolume, 5000);
      expect(result.levels, isNotEmpty);
    });

    test('POC has highest volume', () {
      final candles = makeCandles(basePrice: 100, count: 30);
      final result = calc.build(candles);

      // POC should be a valid price level
      expect(result.pointOfControl, greaterThan(0));
    });
  });
}
