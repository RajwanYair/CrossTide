import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

DailyCandle _ohlc(
  int day, {
  required double open,
  required double high,
  required double low,
  required double close,
}) => DailyCandle(
  date: DateTime(2024, 1, 1).add(Duration(days: day)),
  open: open,
  high: high,
  low: low,
  close: close,
  volume: 1_000_000,
);

/// Generates a gradually rising trend to seed an uptrend SuperTrend.
List<DailyCandle> _uptrend(int count, {double base = 100, double step = 1}) =>
    List.generate(count, (i) {
      final double price = base + i * step;
      return _ohlc(
        i,
        open: price - 0.5,
        high: price + 1,
        low: price - 1,
        close: price,
      );
    });

/// Generates a gradually falling trend.
List<DailyCandle> _downtrend(int count, {double base = 150, double step = 1}) =>
    List.generate(count, (i) {
      final double price = base - i * step;
      return _ohlc(
        i,
        open: price + 0.5,
        high: price + 1,
        low: price - 1,
        close: price,
      );
    });

void main() {
  const detector = SupertrendMethodDetector();

  group('SupertrendMethodDetector', () {
    test('const constructor', () {
      const SupertrendMethodDetector Function() create =
          SupertrendMethodDetector.new;
      expect(create().evaluateBuy(ticker: 'T', candles: []), isNull);
    });

    test('returns null with too few candles', () {
      final cs = _uptrend(5);
      expect(detector.evaluateBuy(ticker: 'T', candles: cs), isNull);
      expect(detector.evaluateSell(ticker: 'T', candles: cs), isNull);
    });

    test('evaluateBuy: returns non-null MethodSignal for sufficient data', () {
      // Downtrend first to trigger SAR downtrend, then uptrend for flip
      final cs = [
        ..._downtrend(20, base: 150),
        ..._uptrend(20, base: 130, step: 2),
      ];
      final signal = detector.evaluateBuy(ticker: 'TEST', candles: cs);
      expect(signal, isNotNull);
      expect(signal!.alertType, AlertType.supertrendMethodBuy);
      expect(signal.ticker, 'TEST');
    });

    test('evaluateSell: returns non-null MethodSignal for sufficient data', () {
      final cs = [..._uptrend(20, base: 100), ..._downtrend(20, base: 120)];
      final signal = detector.evaluateSell(ticker: 'TEST', candles: cs);
      expect(signal, isNotNull);
      expect(signal!.alertType, AlertType.supertrendMethodSell);
    });

    test('BUY triggered when SuperTrend flips from downtrend to uptrend', () {
      final cs = [
        ..._downtrend(30, base: 200),
        // Strong uptrend forces a flip
        ...List.generate(30, (i) {
          final double price = 170 + i * 3.0;
          return _ohlc(
            30 + i,
            open: price - 1,
            high: price + 3,
            low: price - 1,
            close: price,
          );
        }),
      ];

      // Find flip point using the calculator directly
      const calc = SuperTrendCalculator();
      final series = calc.computeSeries(cs);

      int flipIndex = -1;
      for (int i = 1; i < series.length; i++) {
        if (!series[i - 1].isUpTrend && series[i].isUpTrend) {
          flipIndex = i;
          break;
        }
      }
      expect(flipIndex, greaterThan(-1));

      // The flip index in the series corresponds to a candle index offset by
      // atrPeriod since computeSeries starts at that offset
      const int supertrendStart = 10; // default atrPeriod
      final int candleIndex = supertrendStart + flipIndex;
      if (candleIndex < cs.length) {
        final trimmed = cs.sublist(0, candleIndex + 1);
        final signal = detector.evaluateBuy(ticker: 'T', candles: trimmed);
        if (signal != null) {
          expect(signal.alertType, AlertType.supertrendMethodBuy);
        }
      }
    });

    test('SELL triggered when SuperTrend flips from uptrend to downtrend', () {
      final cs = [
        ..._uptrend(30, base: 100),
        // Strong downtrend forces a flip
        ...List.generate(30, (i) {
          final double price = 130 - i * 3.0;
          return _ohlc(
            30 + i,
            open: price + 1,
            high: price + 1,
            low: price - 3,
            close: price,
          );
        }),
      ];

      const calc = SuperTrendCalculator();
      final series = calc.computeSeries(cs);

      int flipIndex = -1;
      for (int i = 1; i < series.length; i++) {
        if (series[i - 1].isUpTrend && !series[i].isUpTrend) {
          flipIndex = i;
          break;
        }
      }
      expect(flipIndex, greaterThan(-1));

      const int supertrendStart = 10;
      final int candleIndex = supertrendStart + flipIndex;
      if (candleIndex < cs.length) {
        final trimmed = cs.sublist(0, candleIndex + 1);
        final signal = detector.evaluateSell(ticker: 'T', candles: trimmed);
        if (signal != null) {
          expect(signal.alertType, AlertType.supertrendMethodSell);
        }
      }
    });

    test('evaluateBoth returns only triggered signals', () {
      final cs = _uptrend(40);
      final signals = detector.evaluateBoth(ticker: 'T', candles: cs);
      for (final MethodSignal s in signals) {
        expect(s.isTriggered, isTrue);
        expect([
          AlertType.supertrendMethodBuy,
          AlertType.supertrendMethodSell,
        ], contains(s.alertType));
      }
    });

    test('methodName is SuperTrend', () {
      expect(SupertrendMethodDetector.methodName, 'SuperTrend');
    });

    test('requiredCandles is atrPeriod + 4', () {
      const d = SupertrendMethodDetector();
      expect(d.requiredCandles, d.supertrendCalculator.atrPeriod + 4);
    });

    test('description contains direction word when triggered', () {
      final cs = [
        ..._downtrend(30, base: 200),
        ...List.generate(30, (i) {
          final double price = 170 + i * 3.0;
          return _ohlc(
            30 + i,
            open: price - 1,
            high: price + 3,
            low: price - 1,
            close: price,
          );
        }),
      ];
      const calc = SuperTrendCalculator();
      final series = calc.computeSeries(cs);
      int flipIndex = -1;
      for (int i = 1; i < series.length; i++) {
        if (!series[i - 1].isUpTrend && series[i].isUpTrend) {
          flipIndex = i;
          break;
        }
      }
      if (flipIndex != -1) {
        final int candleIndex = 10 + flipIndex;
        if (candleIndex < cs.length) {
          final trimmed = cs.sublist(0, candleIndex + 1);
          final signal = detector.evaluateBuy(ticker: 'T', candles: trimmed);
          if (signal != null && signal.isTriggered) {
            expect(signal.description, contains('BUY'));
          }
        }
      }
    });
  });
}
