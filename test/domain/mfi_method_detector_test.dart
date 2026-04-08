import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

List<DailyCandle> _candles(List<double> closes) {
  return [
    for (int i = 0; i < closes.length; i++)
      DailyCandle(
        date: DateTime(2024, 1, 1).add(Duration(days: i)),
        open: closes[i] - 0.5,
        high: closes[i] + 2,
        low: closes[i] - 2,
        close: closes[i],
        volume: 1_000_000,
      ),
  ];
}

void main() {
  const detector = MfiMethodDetector();

  group('MfiMethodDetector', () {
    test('const constructor', () {
      const MfiMethodDetector Function() create = MfiMethodDetector.new;
      expect(create().evaluateBuy(ticker: 'T', candles: []), isNull);
    });

    test('returns null with too few candles', () {
      final cs = _candles(List.filled(10, 100.0));
      expect(detector.evaluateBuy(ticker: 'TEST', candles: cs), isNull);
      expect(detector.evaluateSell(ticker: 'TEST', candles: cs), isNull);
    });

    test('evaluateBuy: returns MethodSignal with correct alertType', () {
      // Sufficient candles for default period=14 (need 16)
      final cs = _candles(List.generate(20, (i) => 100.0 + i * 0.5));
      final signal = detector.evaluateBuy(ticker: 'AAPL', candles: cs);
      expect(signal, isNotNull);
      expect(signal!.alertType, AlertType.mfiMethodBuy);
      expect(signal.ticker, 'AAPL');
      expect(signal.currentClose, isNotNull);
    });

    test('evaluateSell: returns MethodSignal with correct alertType', () {
      final cs = _candles(List.generate(20, (i) => 100.0 + i * 0.5));
      final signal = detector.evaluateSell(ticker: 'AAPL', candles: cs);
      expect(signal, isNotNull);
      expect(signal!.alertType, AlertType.mfiMethodSell);
    });

    test('BUY: isTriggered true when MFI crosses above oversold', () {
      const customDetector = MfiMethodDetector(
        oversoldThreshold: 20.0,
        overboughtThreshold: 80.0,
        period: 5,
      );

      const calc = MfiCalculator();

      // Build a series that drives MFI below 20, then recovers
      final prices = <double>[
        ...List.filled(8, 100.0), // stable baseline
        70, 60, 55, 50, 48, // heavy selling — MFI drops toward 0
        56, 65, 75, // buying surge on big volume
      ];
      final cs = _candles(prices);

      // Inflate volume on recovery bars to push money flow positive
      final List<DailyCandle> modified = [
        for (int i = 0; i < cs.length; i++)
          DailyCandle(
            date: cs[i].date,
            open: cs[i].open,
            high: cs[i].high,
            low: cs[i].low,
            close: cs[i].close,
            volume: i >= cs.length - 3 ? 5_000_000 : 100_000,
          ),
      ];

      final series = calc.computeSeries(modified, period: 5);
      int crossIndex = -1;
      for (int i = 1; i < series.length; i++) {
        final double? prev = series[i - 1].$2;
        final double? curr = series[i].$2;
        if (prev != null && curr != null && prev < 20.0 && curr >= 20.0) {
          crossIndex = i;
          break;
        }
      }
      if (crossIndex != -1) {
        final trimmed = modified.sublist(0, crossIndex + 1);
        final signal = customDetector.evaluateBuy(
          ticker: 'X',
          candles: trimmed,
        );
        expect(signal, isNotNull);
        expect(signal!.isTriggered, isTrue);
        expect(signal.description, contains('BUY'));
      }
    });

    test('SELL: isTriggered true when MFI crosses below overbought', () {
      const customDetector = MfiMethodDetector(
        oversoldThreshold: 20.0,
        overboughtThreshold: 80.0,
        period: 5,
      );

      const calc = MfiCalculator();

      // Heavy buying to push MFI above 80, then selling
      final prices = <double>[
        ...List.filled(8, 100.0),
        120, 130, 135, 140, 142, // surge — MFI high
        138, 132, 128, // pullback
      ];
      final cs = _candles(prices);

      final List<DailyCandle> modified = [
        for (int i = 0; i < cs.length; i++)
          DailyCandle(
            date: cs[i].date,
            open: cs[i].open,
            high: cs[i].high,
            low: cs[i].low,
            close: cs[i].close,
            volume: (i >= 8 && i < 13) ? 5_000_000 : 100_000,
          ),
      ];

      final series = calc.computeSeries(modified, period: 5);
      int crossIndex = -1;
      for (int i = 1; i < series.length; i++) {
        final double? prev = series[i - 1].$2;
        final double? curr = series[i].$2;
        if (prev != null && curr != null && prev > 80.0 && curr <= 80.0) {
          crossIndex = i;
          break;
        }
      }
      if (crossIndex != -1) {
        final trimmed = modified.sublist(0, crossIndex + 1);
        final signal = customDetector.evaluateSell(
          ticker: 'X',
          candles: trimmed,
        );
        expect(signal, isNotNull);
        expect(signal!.isTriggered, isTrue);
        expect(signal.description, contains('SELL'));
      }
    });

    test('evaluateBoth returns only triggered signals', () {
      final cs = _candles(List.generate(30, (i) => 100.0 + (i % 5) * 0.3));
      final signals = detector.evaluateBoth(ticker: 'T', candles: cs);
      for (final MethodSignal s in signals) {
        expect(s.isTriggered, isTrue);
        expect([
          AlertType.mfiMethodBuy,
          AlertType.mfiMethodSell,
        ], contains(s.alertType));
      }
    });

    test('methodName is MFI Method', () {
      expect(MfiMethodDetector.methodName, 'MFI Method');
    });

    test('requiredCandles is period + 2', () {
      expect(detector.requiredCandles, detector.period + 2);
    });
  });
}
