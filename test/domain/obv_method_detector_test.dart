import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

List<DailyCandle> _candles(List<double> values, {List<int>? volumes}) => [
  for (int i = 0; i < values.length; i++)
    DailyCandle(
      date: DateTime(2024, 1, 1).add(Duration(days: i)),
      open: values[i],
      high: values[i] + 1,
      low: values[i] - 1,
      close: values[i],
      volume: volumes != null ? volumes[i] : 1000,
    ),
];

void main() {
  const detector = ObvMethodDetector();

  group('ObvMethodDetector', () {
    test('const constructor', () {
      const ObvMethodDetector Function() create = ObvMethodDetector.new;
      expect(create().evaluateBuy(ticker: 'T', candles: []), isNull);
    });

    test('returns null with too few candles', () {
      final cs = _candles(List.filled(5, 100));
      expect(detector.evaluateBuy(ticker: 'T', candles: cs), isNull);
      expect(detector.evaluateSell(ticker: 'T', candles: cs), isNull);
    });

    test('BUY: bullish divergence (OBV rising, price falling)', () {
      // Price declining but volume pushes OBV up on up-days
      final prices = <double>[
        100,
        102,
        101,
        103,
        100,
        104,
        99,
        105,
        98,
        106,
        97,
        96,
        95,
      ];
      final volumes = <int>[
        1000,
        5000,
        500,
        5000,
        500,
        5000,
        500,
        5000,
        500,
        5000,
        500,
        500,
        500,
      ];
      final cs = _candles(prices, volumes: volumes);

      final signal = detector.evaluateBuy(ticker: 'T', candles: cs);
      expect(signal, isNotNull);
      expect(signal!.alertType, AlertType.obvMethodBuy);
    });

    test('SELL: bearish divergence (OBV falling, price rising)', () {
      final prices = <double>[
        100,
        99,
        101,
        98,
        102,
        97,
        103,
        96,
        104,
        95,
        105,
        106,
        107,
      ];
      final volumes = <int>[
        1000,
        5000,
        500,
        5000,
        500,
        5000,
        500,
        5000,
        500,
        5000,
        500,
        500,
        500,
      ];
      final cs = _candles(prices, volumes: volumes);

      final signal = detector.evaluateSell(ticker: 'T', candles: cs);
      expect(signal, isNotNull);
      expect(signal!.alertType, AlertType.obvMethodSell);
    });

    test('evaluateBoth returns only triggered signals', () {
      final cs = _candles(List.filled(20, 100));
      final signals = detector.evaluateBoth(ticker: 'T', candles: cs);
      for (final MethodSignal s in signals) {
        expect(s.isTriggered, isTrue);
      }
    });

    test('methodName is correct', () {
      expect(ObvMethodDetector.methodName, 'OBV Divergence');
    });

    test('requiredCandles uses lookback', () {
      expect(detector.requiredCandles, 12);
    });
  });
}
