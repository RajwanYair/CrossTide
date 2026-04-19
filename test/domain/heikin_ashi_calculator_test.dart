import 'package:cross_tide/src/domain/heikin_ashi_calculator.dart';
import 'package:flutter_test/flutter_test.dart';

import '../helpers/candle_factory.dart';

DailyCandle _ohlc(
  int day, {
  required double open,
  required double high,
  required double low,
  required double close,
}) => makeOhlc(day, open: open, high: high, low: low, close: close);

void main() {
  const calc = HeikinAshiCalculator();

  group('HeikinAshiCalculator', () {
    test('const constructor', () {
      const HeikinAshiCalculator Function() create = HeikinAshiCalculator.new;
      expect(create().computeSeries([]), isEmpty);
    });
  });

  group('HeikinAshiCalculator.computeSeries', () {
    test('returns empty for empty input', () {
      expect(calc.computeSeries([]), isEmpty);
    });

    test('single candle produces valid HA candle', () {
      final candles = [_ohlc(0, open: 100, high: 110, low: 90, close: 105)];
      final series = calc.computeSeries(candles);
      expect(series.length, 1);
      // HA_Close = (100+110+90+105)/4 = 101.25
      expect(series[0].close, closeTo(101.25, 0.01));
      // HA_Open = (100+105)/2 = 102.5
      expect(series[0].open, closeTo(102.5, 0.01));
    });

    test('HA high >= max(HA_open, HA_close)', () {
      final candles = [
        _ohlc(0, open: 100, high: 110, low: 90, close: 105),
        _ohlc(1, open: 106, high: 115, low: 95, close: 112),
      ];
      final series = calc.computeSeries(candles);
      for (final DailyCandle ha in series) {
        final double maxOC = ha.open > ha.close ? ha.open : ha.close;
        expect(ha.high, greaterThanOrEqualTo(maxOC));
      }
    });

    test('HA low <= min(HA_open, HA_close)', () {
      final candles = [
        _ohlc(0, open: 100, high: 110, low: 90, close: 105),
        _ohlc(1, open: 106, high: 115, low: 95, close: 112),
      ];
      final series = calc.computeSeries(candles);
      for (final DailyCandle ha in series) {
        final double minOC = ha.open < ha.close ? ha.open : ha.close;
        expect(ha.low, lessThanOrEqualTo(minOC));
      }
    });

    test('series preserves dates and volumes', () {
      final candles = [
        _ohlc(0, open: 100, high: 110, low: 90, close: 105),
        _ohlc(1, open: 106, high: 115, low: 95, close: 112),
      ];
      final series = calc.computeSeries(candles);
      for (int i = 0; i < series.length; i++) {
        expect(series[i].date, candles[i].date);
        expect(series[i].volume, candles[i].volume);
      }
    });

    test('HA_Open depends on previous HA values', () {
      final candles = [
        _ohlc(0, open: 100, high: 110, low: 90, close: 105),
        _ohlc(1, open: 106, high: 115, low: 95, close: 112),
        _ohlc(2, open: 113, high: 120, low: 100, close: 118),
      ];
      final series = calc.computeSeries(candles);
      // Second HA_Open = (prev_HA_Open + prev_HA_Close) / 2
      final double expectedOpen2 = (series[0].open + series[0].close) / 2;
      expect(series[1].open, closeTo(expectedOpen2, 0.01));
    });

    test('series length matches input', () {
      final candles = List.generate(
        20,
        (i) => _ohlc(
          i,
          open: 100.0 + i,
          high: 110.0 + i,
          low: 90.0 + i,
          close: 105.0 + i,
        ),
      );
      final series = calc.computeSeries(candles);
      expect(series.length, 20);
    });
  });

  group('HeikinAshiCalculator.compute', () {
    test('returns null for empty input', () {
      expect(calc.compute([]), isNull);
    });

    test('returns last HA candle', () {
      final candles = [
        _ohlc(0, open: 100, high: 110, low: 90, close: 105),
        _ohlc(1, open: 106, high: 115, low: 95, close: 112),
      ];
      final result = calc.compute(candles);
      expect(result, isNotNull);
      final series = calc.computeSeries(candles);
      expect(result!.close, series.last.close);
    });
  });
}
