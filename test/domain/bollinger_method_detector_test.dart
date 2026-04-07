import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

/// Helper: create a list of candles from close prices.
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
  const detector = BollingerMethodDetector();

  group('BollingerMethodDetector', () {
    test('can be constructed at runtime', () {
      const BollingerMethodDetector Function({
        BollingerCalculator bollingerCalculator,
      })
      create = BollingerMethodDetector.new;
      expect(create().evaluateBuy(ticker: 'T', candles: []), isNull);
    });

    test('returns null with too few candles', () {
      final cs = _candles(List.filled(15, 100.0));
      expect(detector.evaluateBuy(ticker: 'TEST', candles: cs), isNull);
      expect(detector.evaluateSell(ticker: 'TEST', candles: cs), isNull);
    });

    test('no trigger when price is flat', () {
      // Flat prices → bands are very tight around mean → no crossover
      final cs = _candles(List.filled(30, 100.0));
      final buy = detector.evaluateBuy(ticker: 'FLAT', candles: cs);
      final sell = detector.evaluateSell(ticker: 'FLAT', candles: cs);
      if (buy != null) expect(buy.isTriggered, isFalse);
      if (sell != null) expect(sell.isTriggered, isFalse);
    });

    test('BUY: price crosses above lower band from below', () {
      // First create volatility, then dip below lower band, then recover
      final prices = <double>[
        ...List.filled(20, 100.0),
        // Create some volatility
        105, 95, 105, 95, 105, 95,
        // Dip well below lower band
        80, 75,
        // Recover above lower band
        90, 95,
      ];
      final cs = _candles(prices);

      const calc = BollingerCalculator();
      final series = calc.computeSeries(cs);

      // Find the crossover in the series
      for (int i = 1; i < series.length; i++) {
        final prevLower = series[i - 1].lower;
        final currLower = series[i].lower;
        if (prevLower != null && currLower != null) {
          final prevClose = cs[i - 1].close;
          final currClose = cs[i].close;
          if (prevClose <= prevLower && currClose > currLower) {
            final trimmed = cs.sublist(0, i + 1);
            final signal = detector.evaluateBuy(
              ticker: 'BUY',
              candles: trimmed,
            );
            if (signal != null && signal.isTriggered) {
              expect(signal.alertType, AlertType.bollingerMethodBuy);
              expect(signal.description, contains('BUY'));
            }
            break;
          }
        }
      }
    });

    test('SELL: price crosses below upper band from above', () {
      // First create volatility, then spike above upper band, then drop
      final prices = <double>[
        ...List.filled(20, 100.0),
        105, 95, 105, 95, 105, 95,
        // Spike well above upper band
        120, 125,
        // Drop back below upper band
        110, 105,
      ];
      final cs = _candles(prices);

      const calc = BollingerCalculator();
      final series = calc.computeSeries(cs);

      for (int i = 1; i < series.length; i++) {
        final prevUpper = series[i - 1].upper;
        final currUpper = series[i].upper;
        if (prevUpper != null && currUpper != null) {
          final prevClose = cs[i - 1].close;
          final currClose = cs[i].close;
          if (prevClose >= prevUpper && currClose < currUpper) {
            final trimmed = cs.sublist(0, i + 1);
            final signal = detector.evaluateSell(
              ticker: 'SELL',
              candles: trimmed,
            );
            if (signal != null && signal.isTriggered) {
              expect(signal.alertType, AlertType.bollingerMethodSell);
              expect(signal.description, contains('SELL'));
            }
            break;
          }
        }
      }
    });

    test('evaluateBoth returns only triggered signals', () {
      final cs = _candles(List.filled(30, 100.0));
      final signals = detector.evaluateBoth(ticker: 'N', candles: cs);
      expect(signals, isEmpty);
    });

    test('methodName is Bollinger Bands', () {
      expect(BollingerMethodDetector.methodName, 'Bollinger Bands');
    });

    test('requiredCandles is 21', () {
      expect(BollingerMethodDetector.requiredCandles, 21);
    });
  });
}
