import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const detector = VolatilityRegimeDetector();

  // 30 candles with increasing volatility
  final candles = [
    for (int i = 0; i < 30; i++)
      DailyCandle(
        date: DateTime(2024, 1, 1).add(Duration(days: i)),
        open: 100.0 + i * 0.2,
        high: 102.0 + i * 0.3,
        low: 98.0 + i * 0.1,
        close: 100.5 + i * 0.2,
        volume: 1000000,
      ),
  ];

  group('VolatilityRegimeDetector', () {
    test('detect returns result for sufficient data', () {
      final result = detector.detect(ticker: 'AAPL', candles: candles);
      expect(result, isNotNull);
      expect(result!.ticker, 'AAPL');
      expect(result.regime, isA<VolatilityRegime>());
      expect(result.currentAtr, greaterThan(0));
      expect(result.atrPercentile, greaterThanOrEqualTo(0));
    });

    test('detect returns null for insufficient data', () {
      final result = detector.detect(
        ticker: 'AAPL',
        candles: candles.sublist(0, 5),
      );
      expect(result, isNull);
    });

    test('custom thresholds work', () {
      const custom = VolatilityRegimeDetector(
        lowThreshold: 10.0,
        highThreshold: 90.0,
      );
      final result = custom.detect(ticker: 'AAPL', candles: candles);
      expect(result, isNotNull);
    });
  });
}
