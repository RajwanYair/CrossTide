import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

List<DailyCandle> _candles(List<double> values, {double spread = 2}) => [
  for (int i = 0; i < values.length; i++)
    DailyCandle(
      date: DateTime(2024, 1, 1).add(Duration(days: i)),
      open: values[i],
      high: values[i] + spread,
      low: values[i] - spread,
      close: values[i],
      volume: 1000,
    ),
];

void main() {
  const detector = StochasticMethodDetector();

  group('StochasticMethodDetector', () {
    test('const constructor', () {
      const StochasticMethodDetector Function() create =
          StochasticMethodDetector.new;
      expect(create().evaluateBuy(ticker: 'T', candles: []), isNull);
    });

    test('returns null with too few candles', () {
      final cs = _candles(List.filled(5, 100));
      expect(detector.evaluateBuy(ticker: 'T', candles: cs), isNull);
      expect(detector.evaluateSell(ticker: 'T', candles: cs), isNull);
    });

    test('evaluateBuy returns non-null for sufficient data', () {
      final prices = List.generate(30, (i) => 100.0 + i);
      final cs = _candles(prices);
      final signal = detector.evaluateBuy(ticker: 'T', candles: cs);
      expect(signal, isNotNull);
      expect(signal!.alertType, AlertType.stochasticMethodBuy);
    });

    test('evaluateSell returns non-null for sufficient data', () {
      final prices = List.generate(30, (i) => 200.0 - i);
      final cs = _candles(prices);
      final signal = detector.evaluateSell(ticker: 'T', candles: cs);
      expect(signal, isNotNull);
      expect(signal!.alertType, AlertType.stochasticMethodSell);
    });

    test('evaluateBoth returns only triggered signals', () {
      final cs = _candles(List.filled(30, 100));
      final signals = detector.evaluateBoth(ticker: 'T', candles: cs);
      for (final MethodSignal s in signals) {
        expect(s.isTriggered, isTrue);
      }
    });

    test('methodName is correct', () {
      expect(StochasticMethodDetector.methodName, 'Stochastic Method');
    });

    test('requiredCandles matches formula', () {
      expect(detector.requiredCandles, 14 + 3 + 3);
    });
  });
}
