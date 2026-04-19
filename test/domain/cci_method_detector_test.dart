import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

import '../helpers/candle_factory.dart';

DailyCandle _ohlc(
  int day, {
  required double high,
  required double low,
  required double close,
}) => makeOhlc(day, open: close, high: high, low: low, close: close);

List<DailyCandle> _flat(int count, {double price = 100}) => List.generate(
  count,
  (i) => _ohlc(i, high: price + 1, low: price - 1, close: price),
);

void main() {
  const detector = CciMethodDetector();

  group('CciMethodDetector', () {
    test('const constructor', () {
      const CciMethodDetector Function() create = CciMethodDetector.new;
      expect(create().evaluateBuy(ticker: 'T', candles: []), isNull);
    });

    test('returns null with too few candles', () {
      final cs = _flat(10);
      expect(detector.evaluateBuy(ticker: 'T', candles: cs), isNull);
      expect(detector.evaluateSell(ticker: 'T', candles: cs), isNull);
    });

    test('evaluateBuy returns non-null for sufficient data', () {
      // Build data that drives CCI from below -100 to above -100
      final prices = <double>[
        ...List.filled(20, 100.0),
        // Drop to push CCI below -100
        85, 82, 80,
        // Recover to push CCI back above -100
        90, 95,
      ];
      final cs = [
        for (int i = 0; i < prices.length; i++)
          _ohlc(i, high: prices[i] + 1, low: prices[i] - 1, close: prices[i]),
      ];
      final signal = detector.evaluateBuy(ticker: 'T', candles: cs);
      expect(signal, isNotNull);
      expect(signal!.alertType, AlertType.cciMethodBuy);
    });

    test('evaluateSell returns non-null for sufficient data', () {
      // Build data that drives CCI from above +100 to below +100
      final prices = <double>[
        ...List.filled(20, 100.0),
        // Surge to push CCI above +100
        115, 120, 125,
        // Pullback to drop CCI below +100
        115, 110,
      ];
      final cs = [
        for (int i = 0; i < prices.length; i++)
          _ohlc(i, high: prices[i] + 1, low: prices[i] - 1, close: prices[i]),
      ];
      final signal = detector.evaluateSell(ticker: 'T', candles: cs);
      expect(signal, isNotNull);
      expect(signal!.alertType, AlertType.cciMethodSell);
    });

    test('flat data does not trigger', () {
      final cs = _flat(30);
      final buy = detector.evaluateBuy(ticker: 'T', candles: cs);
      final sell = detector.evaluateSell(ticker: 'T', candles: cs);
      expect(buy?.isTriggered, isFalse);
      expect(sell?.isTriggered, isFalse);
    });

    test('evaluateBoth returns only triggered signals', () {
      final cs = _flat(30);
      final signals = detector.evaluateBoth(ticker: 'T', candles: cs);
      for (final MethodSignal s in signals) {
        expect(s.isTriggered, isTrue);
      }
    });

    test('methodName is correct', () {
      expect(CciMethodDetector.methodName, 'CCI Method');
    });
  });
}
