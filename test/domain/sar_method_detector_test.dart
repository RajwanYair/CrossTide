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
  volume: 1000000,
);

List<DailyCandle> _uptrend(int count, {double base = 100, double step = 2}) =>
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

void main() {
  const detector = SarMethodDetector();

  group('SarMethodDetector', () {
    test('const constructor', () {
      const SarMethodDetector Function() create = SarMethodDetector.new;
      expect(create().evaluateBuy(ticker: 'T', candles: []), isNull);
    });

    test('returns null with too few candles', () {
      final cs = _uptrend(2);
      expect(detector.evaluateBuy(ticker: 'T', candles: cs), isNull);
      expect(detector.evaluateSell(ticker: 'T', candles: cs), isNull);
    });

    test('evaluateBuy returns non-null for sufficient data', () {
      // Start down, then go up to trigger SAR flip
      final cs = [
        ...List.generate(5, (i) {
          final double price = 100 - i * 3.0;
          return _ohlc(
            i,
            open: price + 0.5,
            high: price + 2,
            low: price - 2,
            close: price,
          );
        }),
        ...List.generate(10, (i) {
          final double price = 90 + i * 4.0;
          return _ohlc(
            i + 5,
            open: price - 0.5,
            high: price + 2,
            low: price - 2,
            close: price,
          );
        }),
      ];
      final signal = detector.evaluateBuy(ticker: 'T', candles: cs);
      expect(signal, isNotNull);
      expect(signal!.alertType, AlertType.sarMethodBuy);
    });

    test('evaluateSell returns non-null for sufficient data', () {
      // Start up, then reverse down
      final cs = [
        ...List.generate(5, (i) {
          final double price = 100 + i * 3.0;
          return _ohlc(
            i,
            open: price - 0.5,
            high: price + 2,
            low: price - 2,
            close: price,
          );
        }),
        ...List.generate(10, (i) {
          final double price = 115 - i * 4.0;
          return _ohlc(
            i + 5,
            open: price + 0.5,
            high: price + 2,
            low: price - 2,
            close: price,
          );
        }),
      ];
      final signal = detector.evaluateSell(ticker: 'T', candles: cs);
      expect(signal, isNotNull);
      expect(signal!.alertType, AlertType.sarMethodSell);
    });

    test('evaluateBoth returns only triggered signals', () {
      final cs = _uptrend(10);
      final signals = detector.evaluateBoth(ticker: 'T', candles: cs);
      for (final MethodSignal s in signals) {
        expect(s.isTriggered, isTrue);
      }
    });

    test('methodName is correct', () {
      expect(SarMethodDetector.methodName, 'Parabolic SAR');
    });

    test('requiredCandles is 5', () {
      expect(detector.requiredCandles, 5);
    });
  });
}
