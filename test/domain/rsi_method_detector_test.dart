import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

/// Helper: create a list of candles with predictable RSI behaviour.
/// [values] are close prices.
List<DailyCandle> _candles(List<double> values) {
  return [
    for (int i = 0; i < values.length; i++)
      DailyCandle(
        date: DateTime(2024, 1, 1).add(Duration(days: i)),
        open: values[i],
        high: values[i] + 1,
        low: values[i] - 1,
        close: values[i],
        volume: 1000,
      ),
  ];
}

void main() {
  const detector = RsiMethodDetector();

  group('RsiMethodDetector', () {
    test('can be constructed at runtime', () {
      const RsiMethodDetector Function({
        RsiCalculator rsiCalculator,
        double oversoldThreshold,
        double overboughtThreshold,
        int period,
      })
      create = RsiMethodDetector.new;
      expect(create().evaluateBuy(ticker: 'T', candles: []), isNull);
    });

    test('returns null with too few candles', () {
      final cs = _candles(List.filled(10, 100.0));
      expect(detector.evaluateBuy(ticker: 'TEST', candles: cs), isNull);
      expect(detector.evaluateSell(ticker: 'TEST', candles: cs), isNull);
    });

    test('BUY: RSI exits oversold (crosses up through 30)', () {
      // Build a series that drives RSI below 30, then slightly recovers
      final prices = <double>[
        // 16 stable candles at 100 -> initialises RSI near 50
        ...List.filled(16, 100.0),
        // Sudden drop to drive RSI well below 30
        80, 70, 60, 50, 45, 42,
        // Now a small recovery that should nudge RSI back above 30
        50, 55, 60,
      ];
      final cs = _candles(prices);

      // Compute raw RSI to find where the crossover actually happens
      const calc = RsiCalculator();
      final series = calc.computeSeries(cs);
      // Find the index where RSI crosses from below 30 to above 30
      int crossIndex = -1;
      for (int i = 1; i < series.length; i++) {
        final prev = series[i - 1].$2;
        final curr = series[i].$2;
        if (prev != null && curr != null && prev < 30 && curr >= 30) {
          crossIndex = i;
          break;
        }
      }

      if (crossIndex != -1) {
        // Feed exactly up to (and including) the cross candle
        final trimmed = cs.sublist(0, crossIndex + 1);
        final signal = detector.evaluateBuy(ticker: 'X', candles: trimmed);
        expect(signal, isNotNull);
        expect(signal!.isTriggered, isTrue);
        expect(signal.alertType, AlertType.rsiMethodBuy);
        expect(signal.description, contains('BUY'));
      }
    });

    test('SELL: RSI exits overbought (crosses down through 70)', () {
      // Build a series that drives RSI above 70, then drops
      final prices = <double>[
        ...List.filled(16, 100.0),
        120, 130, 140, 150, 155, 158,
        // Now price falls to push RSI below 70
        150, 145, 140,
      ];
      final cs = _candles(prices);

      const calc = RsiCalculator();
      final series = calc.computeSeries(cs);
      int crossIndex = -1;
      for (int i = 1; i < series.length; i++) {
        final prev = series[i - 1].$2;
        final curr = series[i].$2;
        if (prev != null && curr != null && prev > 70 && curr <= 70) {
          crossIndex = i;
          break;
        }
      }

      if (crossIndex != -1) {
        final trimmed = cs.sublist(0, crossIndex + 1);
        final signal = detector.evaluateSell(ticker: 'Y', candles: trimmed);
        expect(signal, isNotNull);
        expect(signal!.isTriggered, isTrue);
        expect(signal.alertType, AlertType.rsiMethodSell);
        expect(signal.description, contains('SELL'));
      }
    });

    test('no trigger when RSI stays in neutral range', () {
      final prices = List.filled(30, 100.0);
      final cs = _candles(prices);
      final buy = detector.evaluateBuy(ticker: 'FLAT', candles: cs);
      final sell = detector.evaluateSell(ticker: 'FLAT', candles: cs);
      expect(buy?.isTriggered, isFalse);
      expect(sell?.isTriggered, isFalse);
    });

    test('evaluateBoth returns only triggered signals', () {
      final prices = List.filled(30, 100.0);
      final cs = _candles(prices);
      final signals = detector.evaluateBoth(ticker: 'N', candles: cs);
      expect(signals, isEmpty);
    });

    test('methodName is RSI Method', () {
      expect(RsiMethodDetector.methodName, 'RSI Method');
    });
  });
}
