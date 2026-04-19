import 'package:cross_tide/src/domain/obv_calculator.dart';
import 'package:flutter_test/flutter_test.dart';

import '../helpers/candle_factory.dart';

DailyCandle _candle(int day, {required double close, int volume = 1000}) =>
    makeOhlc(day, close: close, volume: volume);

void main() {
  const calc = ObvCalculator();

  group('ObvCalculator', () {
    test('const constructor', () {
      const ObvCalculator Function() create = ObvCalculator.new;
      expect(create().computeSeries([]), isEmpty);
    });
  });

  group('ObvCalculator.computeSeries', () {
    test('returns empty list for fewer than 2 candles', () {
      expect(calc.computeSeries([]), isEmpty);
      expect(calc.computeSeries([_candle(0, close: 100)]), isEmpty);
    });

    test('adds volume on up day', () {
      final candles = [
        _candle(0, close: 100, volume: 500),
        _candle(1, close: 105, volume: 1000),
      ];
      final series = calc.computeSeries(candles);
      expect(series.length, 2);
      expect(series[0].$2, 0);
      expect(series[1].$2, 1000);
    });

    test('subtracts volume on down day', () {
      final candles = [
        _candle(0, close: 100, volume: 500),
        _candle(1, close: 95, volume: 800),
      ];
      final series = calc.computeSeries(candles);
      expect(series[1].$2, -800);
    });

    test('unchanged volume on equal close', () {
      final candles = [
        _candle(0, close: 100, volume: 500),
        _candle(1, close: 100, volume: 900),
      ];
      final series = calc.computeSeries(candles);
      expect(series[1].$2, 0);
    });

    test('cumulates correctly over multiple bars', () {
      final candles = [
        _candle(0, close: 100, volume: 100),
        _candle(1, close: 105, volume: 200), // +200 = 200
        _candle(2, close: 103, volume: 150), // -150 = 50
        _candle(3, close: 110, volume: 300), // +300 = 350
        _candle(4, close: 110, volume: 100), // unchanged = 350
      ];
      final series = calc.computeSeries(candles);
      expect(series[0].$2, 0);
      expect(series[1].$2, 200);
      expect(series[2].$2, 50);
      expect(series[3].$2, 350);
      expect(series[4].$2, 350);
    });

    test('series length matches candle count', () {
      final candles = List.generate(
        20,
        (i) => _candle(i, close: 100.0 + i, volume: 1000),
      );
      final series = calc.computeSeries(candles);
      expect(series.length, 20);
    });
  });

  group('ObvCalculator.compute', () {
    test('returns null when fewer than 2 candles', () {
      expect(calc.compute([]), isNull);
      expect(calc.compute([_candle(0, close: 100)]), isNull);
    });

    test('returns last OBV value', () {
      final candles = [
        _candle(0, close: 100, volume: 100),
        _candle(1, close: 110, volume: 500),
        _candle(2, close: 105, volume: 300),
      ];
      final result = calc.compute(candles);
      expect(result, 200); // +500 - 300
    });
  });
}
