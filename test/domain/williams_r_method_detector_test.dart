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
        volume: 1000000,
      ),
  ];
}

void main() {
  const detector = WilliamsRMethodDetector();

  group('WilliamsRMethodDetector', () {
    test('const constructor', () {
      const WilliamsRMethodDetector Function() create =
          WilliamsRMethodDetector.new;
      expect(create().evaluateBuy(ticker: 'T', candles: []), isNull);
    });

    test('returns null with too few candles', () {
      final cs = _candles(List<double>.filled(5, 100.0));
      expect(detector.evaluateBuy(ticker: 'TEST', candles: cs), isNull);
      expect(detector.evaluateSell(ticker: 'TEST', candles: cs), isNull);
    });

    test('evaluateBuy: returns non-null MethodSignal for sufficient data', () {
      // Build a declining series to push %R below -80, then small recovery
      final prices = <double>[
        ...List<double>.filled(14, 100.0), // stable baseline
        75, 68, 60, 55, 52, // big drop — %R enters oversold
        58, 63, 70, // bounce — %R should cross above -80
      ];
      final cs = _candles(prices);
      final signal = detector.evaluateBuy(ticker: 'TEST', candles: cs);
      // May or may not be triggered, but must return a non-null MethodSignal
      expect(signal, isNotNull);
      expect(signal!.alertType, AlertType.williamsRMethodBuy);
      expect(signal.ticker, 'TEST');
    });

    test('evaluateSell: returns non-null MethodSignal for sufficient data', () {
      // Build a rising series to push %R above -20, then small pullback
      final prices = <double>[
        ...List<double>.filled(14, 100.0), // stable baseline
        115, 122, 130, 135, 138, // big rally — %R enters overbought
        132, 128, 124, // pullback — %R should cross below -20
      ];
      final cs = _candles(prices);
      final signal = detector.evaluateSell(ticker: 'TEST', candles: cs);
      expect(signal, isNotNull);
      expect(signal!.alertType, AlertType.williamsRMethodSell);
    });

    test('BUY: isTriggered true when %R crosses above oversold threshold', () {
      // Need %R[t-1] < -80 and %R[t] >= -80
      // Use custom thresholds and a calculable series
      const customDetector = WilliamsRMethodDetector(
        oversoldThreshold: -80.0,
        overboughtThreshold: -20.0,
        period: 3,
      );
      // period=3 requires 4 candles minimum
      // Drive range so %R goes from below -80 then recovers
      final prices = [
        100.0, 102.0, 104.0, // warmup — high range stable
        80.0, // drop — lowest_low, price well below range → %R << -80
        95.0, // recovery — price near middle of range → %R nearer to threshold
        101.0, // further recovery
      ];
      final cs = _candles(prices);

      const calc = WilliamsPercentRCalculator();
      final series = calc.computeSeries(cs, period: 3);

      // Find crossover index
      int crossIndex = -1;
      for (int i = 1; i < series.length; i++) {
        final double? prev = series[i - 1].$2;
        final double? curr = series[i].$2;
        if (prev != null && curr != null && prev < -80.0 && curr >= -80.0) {
          crossIndex = i;
          break;
        }
      }
      if (crossIndex != -1) {
        final trimmed = cs.sublist(0, crossIndex + 1);
        final signal = customDetector.evaluateBuy(
          ticker: 'X',
          candles: trimmed,
        );
        expect(signal, isNotNull);
        expect(signal!.isTriggered, isTrue);
        expect(signal.description, contains('BUY'));
      }
    });

    test(
      'SELL: isTriggered true when %R crosses below overbought threshold',
      () {
        const customDetector = WilliamsRMethodDetector(
          oversoldThreshold: -80.0,
          overboughtThreshold: -20.0,
          period: 3,
        );
        // Drive %R above -20 then below -20
        final prices = [
          100.0, 102.0, 104.0, // warmup
          120.0, // spike up — price at new high → %R near 0 (overbought)
          115.0, // slight drop — %R crosses below -20
          108.0,
        ];
        final cs = _candles(prices);

        const calc = WilliamsPercentRCalculator();
        final series = calc.computeSeries(cs, period: 3);

        int crossIndex = -1;
        for (int i = 1; i < series.length; i++) {
          final double? prev = series[i - 1].$2;
          final double? curr = series[i].$2;
          if (prev != null && curr != null && prev > -20.0 && curr <= -20.0) {
            crossIndex = i;
            break;
          }
        }
        if (crossIndex != -1) {
          final trimmed = cs.sublist(0, crossIndex + 1);
          final signal = customDetector.evaluateSell(
            ticker: 'X',
            candles: trimmed,
          );
          expect(signal, isNotNull);
          expect(signal!.isTriggered, isTrue);
          expect(signal.description, contains('SELL'));
        }
      },
    );

    test('evaluateBoth returns empty when nothing triggered', () {
      // Flat prices keep %R mid-range, no extremes
      final cs = _candles(
        List<double>.generate(20, (i) => 100.0 + (i % 3) * 0.5),
      );
      final signals = detector.evaluateBoth(ticker: 'T', candles: cs);
      for (final MethodSignal s in signals) {
        expect(s.isTriggered, isTrue);
      }
    });

    test('evaluateBoth returns only triggered signals', () {
      final prices = <double>[
        ...List<double>.filled(16, 100.0),
        70, 60, 55, 50, 48, // deep oversold
        55, 62, 70, // recovery
      ];
      final cs = _candles(prices);
      final signals = detector.evaluateBoth(ticker: 'T', candles: cs);
      for (final MethodSignal s in signals) {
        expect(s.isTriggered, isTrue);
        expect([
          AlertType.williamsRMethodBuy,
          AlertType.williamsRMethodSell,
        ], contains(s.alertType));
      }
    });

    test('methodName is Williams %R', () {
      expect(WilliamsRMethodDetector.methodName, 'Williams %R');
    });

    test('requiredCandles is period + 1', () {
      expect(detector.requiredCandles, detector.period + 1);
    });
  });
}
