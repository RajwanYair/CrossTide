import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

List<DailyCandle> _candles(int count) => List.generate(
  count,
  (i) => DailyCandle(
    date: DateTime(2023, 1, 1).add(Duration(days: i)),
    open: 50.0 + i * 0.5,
    high: 50.0 + i * 0.5 + 2,
    low: 50.0 + i * 0.5 - 2,
    close: 50.0 + i * 0.5,
    volume: 100000,
  ),
);

void main() {
  const calculator = MovingAverageRibbonCalculator();

  group('MovingAverageRibbonCalculator', () {
    test('const constructor', () {
      const MovingAverageRibbonCalculator Function() create =
          MovingAverageRibbonCalculator.new;
      expect(create(), isNotNull);
    });

    test('returns empty for empty candles', () {
      expect(calculator.compute([]), isEmpty);
    });

    test('returns ribbon points for sufficient data', () {
      final candles = _candles(250);
      final ribbon = calculator.compute(candles);
      expect(ribbon, isNotEmpty);
      // Each point should have values for all 6 default periods
      expect(ribbon.first.values.length, 6);
    });

    test('dates are sorted', () {
      final candles = _candles(250);
      final ribbon = calculator.compute(candles);
      for (int i = 1; i < ribbon.length; i++) {
        expect(ribbon[i].date.isAfter(ribbon[i - 1].date), isTrue);
      }
    });

    test('bullish alignment for strong uptrend', () {
      final candles = _candles(250);
      final ribbon = calculator.compute(candles, periods: [10, 20, 50]);
      // In a steady uptrend, short MAs should be above long MAs
      final RibbonPoint last = ribbon.last;
      expect(last.isBullish, isTrue);
    });

    test('custom periods work', () {
      final candles = _candles(100);
      final ribbon = calculator.compute(candles, periods: [5, 10, 20]);
      expect(ribbon, isNotEmpty);
      expect(ribbon.first.values.keys.toSet(), {5, 10, 20});
    });

    test('equatable on RibbonPoint', () {
      final candles = _candles(250);
      final r1 = calculator.compute(candles);
      final r2 = calculator.compute(candles);
      expect(r1.last, equals(r2.last));
    });
  });
}
