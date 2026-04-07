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
        high: price + 2,
        low: price - 2,
        close: price,
      );
    });

void main() {
  const detector = AdxMethodDetector();

  group('AdxMethodDetector', () {
    test('const constructor', () {
      const AdxMethodDetector Function() create = AdxMethodDetector.new;
      expect(create().evaluateBuy(ticker: 'T', candles: []), isNull);
    });

    test('returns null with too few candles', () {
      final cs = _uptrend(10);
      expect(detector.evaluateBuy(ticker: 'T', candles: cs), isNull);
      expect(detector.evaluateSell(ticker: 'T', candles: cs), isNull);
    });

    test('evaluateBuy returns non-null for sufficient data', () {
      final cs = _uptrend(40);
      final signal = detector.evaluateBuy(ticker: 'T', candles: cs);
      expect(signal, isNotNull);
      expect(signal!.alertType, AlertType.adxMethodBuy);
    });

    test('evaluateSell returns non-null for sufficient data', () {
      // Downtrend
      final cs = List.generate(40, (i) {
        final double price = 200 - i * 2.0;
        return _ohlc(
          i,
          open: price + 0.5,
          high: price + 2,
          low: price - 2,
          close: price,
        );
      });
      final signal = detector.evaluateSell(ticker: 'T', candles: cs);
      expect(signal, isNotNull);
      expect(signal!.alertType, AlertType.adxMethodSell);
    });

    test('evaluateBoth returns only triggered signals', () {
      final cs = _uptrend(40);
      final signals = detector.evaluateBoth(ticker: 'T', candles: cs);
      for (final MethodSignal s in signals) {
        expect(s.isTriggered, isTrue);
      }
    });

    test('methodName is correct', () {
      expect(AdxMethodDetector.methodName, 'ADX Trend');
    });

    test('threshold defaults to 25', () {
      expect(detector.threshold, 25.0);
    });
  });
}
