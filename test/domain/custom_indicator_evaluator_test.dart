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
  const evaluator = CustomIndicatorEvaluator();

  group('CustomIndicatorEvaluator', () {
    test('const constructor', () {
      const CustomIndicatorEvaluator Function() create =
          CustomIndicatorEvaluator.new;
      expect(create(), isNotNull);
    });

    test('returns null for invalid config', () {
      const config = CustomIndicatorConfig(type: IndicatorType.sma, period: 0);
      final result = evaluator.evaluate(
        config: config,
        candles: _candles([100, 200, 300]),
      );
      expect(result, isNull);
    });

    test('returns null for too few candles', () {
      const config = CustomIndicatorConfig(type: IndicatorType.sma, period: 5);
      final result = evaluator.evaluate(
        config: config,
        candles: _candles([100]),
      );
      expect(result, isNull);
    });

    test('computes SMA series', () {
      const config = CustomIndicatorConfig(type: IndicatorType.sma, period: 3);
      final candles = _candles([10, 20, 30, 40, 50]);
      final result = evaluator.evaluate(config: config, candles: candles);
      expect(result, isNotNull);
      expect(result!.series.length, candles.length);
      expect(result.config, config);
    });

    test('computes EMA series', () {
      const config = CustomIndicatorConfig(type: IndicatorType.ema, period: 3);
      final candles = _candles([10, 20, 30, 40, 50]);
      final result = evaluator.evaluate(config: config, candles: candles);
      expect(result, isNotNull);
      expect(result!.series.length, candles.length);
    });

    test('detects cross-up when alertOnCrossover is true', () {
      const config = CustomIndicatorConfig(
        type: IndicatorType.sma,
        period: 3,
        alertOnCrossover: true,
      );
      // SMA3 at index 4: (30+40+50)/3 = 40, prev close 40 > SMA≈33
      // Build so prev close < SMA, curr close > SMA
      final candles = _candles([100, 100, 100, 90, 110]);
      final result = evaluator.evaluate(config: config, candles: candles);
      expect(result, isNotNull);
      expect(result!.crossUp, isTrue);
    });

    test('detects cross-down when alertOnCrossover is true', () {
      const config = CustomIndicatorConfig(
        type: IndicatorType.sma,
        period: 3,
        alertOnCrossover: true,
      );
      final candles = _candles([100, 100, 100, 110, 90]);
      final result = evaluator.evaluate(config: config, candles: candles);
      expect(result, isNotNull);
      expect(result!.crossDown, isTrue);
    });

    test('no cross events when alertOnCrossover is false', () {
      const config = CustomIndicatorConfig(
        type: IndicatorType.sma,
        period: 3,
        alertOnCrossover: false,
      );
      final candles = _candles([100, 100, 100, 90, 110]);
      final result = evaluator.evaluate(config: config, candles: candles);
      expect(result, isNotNull);
      expect(result!.crossUp, isFalse);
      expect(result.crossDown, isFalse);
    });

    test('latestValue returns the most recent non-null value', () {
      const config = CustomIndicatorConfig(type: IndicatorType.sma, period: 3);
      final candles = _candles([10, 20, 30, 40, 50]);
      final result = evaluator.evaluate(config: config, candles: candles);
      expect(result!.latestValue, isNotNull);
    });

    test('latestValue is null when series is all nulls', () {
      const config = CustomIndicatorConfig(type: IndicatorType.sma, period: 10);
      // Only 3 candles, SMA10 will be null for all
      final candles = _candles([10, 20, 30]);
      final result = evaluator.evaluate(config: config, candles: candles);
      expect(result!.latestValue, isNull);
    });

    test('CustomIndicatorResult equality', () {
      const config = CustomIndicatorConfig(type: IndicatorType.sma, period: 3);
      const r1 = CustomIndicatorResult(config: config, series: []);
      const r2 = CustomIndicatorResult(config: config, series: []);
      expect(r1, equals(r2));
    });
  });
}
