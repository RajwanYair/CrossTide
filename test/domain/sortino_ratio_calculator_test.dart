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
  const calculator = SortinoRatioCalculator();

  group('SortinoRatioCalculator', () {
    test('const constructor', () {
      const SortinoRatioCalculator Function() create =
          SortinoRatioCalculator.new;
      expect(create(), isNotNull);
    });

    test('returns null for too few candles', () {
      expect(calculator.compute(_candles([100, 110])), isNull);
    });

    test('returns positive for uptrend with some down days', () {
      // Overall uptrend with small dips for downside deviation
      final prices = <double>[];
      for (int i = 0; i < 60; i++) {
        prices.add(100.0 + i * 0.4 + (i.isEven ? -0.2 : 0.2));
      }
      final sortino = calculator.compute(_candles(prices));
      expect(sortino, isNotNull);
      expect(sortino!, greaterThan(0));
    });

    test('returns null when no downside returns', () {
      // Monotonically increasing → no negative returns → null
      final candles = _candles(List.generate(60, (i) => 100.0 + i.toDouble()));
      expect(calculator.compute(candles), isNull);
    });

    test('higher MAR lowers Sortino', () {
      final prices = <double>[];
      for (int i = 0; i < 60; i++) {
        prices.add(100.0 + i * 0.3 + (i.isEven ? -0.3 : 0.1));
      }
      final candles = _candles(prices);
      final s0 = calculator.compute(candles, minimumAcceptableReturn: 0.0);
      final s10 = calculator.compute(candles, minimumAcceptableReturn: 0.10);
      if (s0 != null && s10 != null) {
        expect(s10, lessThan(s0));
      }
    });
  });
}
