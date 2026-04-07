import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const calc = RelativeVolumeCalculator();

  List<DailyCandle> makeCandles(List<int> volumes) {
    return [
      for (int i = 0; i < volumes.length; i++)
        DailyCandle(
          date: DateTime(2024, 1, 1 + i),
          open: 100,
          high: 105,
          low: 95,
          close: 100,
          volume: volumes[i],
        ),
    ];
  }

  group('RelativeVolumeCalculator', () {
    test('returns null when insufficient data', () {
      final candles = makeCandles(List.filled(10, 1000));
      expect(calc.compute(ticker: 'AAPL', candles: candles), isNull);
    });

    test('computes normal relative volume', () {
      final volumes = List.filled(21, 1000);
      final candles = makeCandles(volumes);
      final result = calc.compute(ticker: 'AAPL', candles: candles);

      expect(result, isNotNull);
      expect(result!.relativeVolume, closeTo(1.0, 0.01));
      expect(result.level, VolumeLevel.normal);
    });

    test('detects very high relative volume', () {
      final volumes = [...List.filled(20, 1000), 5000];
      final candles = makeCandles(volumes);
      final result = calc.compute(ticker: 'TSLA', candles: candles);

      expect(result, isNotNull);
      expect(result!.relativeVolume, greaterThan(2.0));
      expect(result.level, VolumeLevel.veryHigh);
    });

    test('detects low relative volume', () {
      final volumes = [...List.filled(20, 1000), 300];
      final candles = makeCandles(volumes);
      final result = calc.compute(ticker: 'IBM', candles: candles);

      expect(result, isNotNull);
      expect(result!.relativeVolume, lessThan(0.5));
    });
  });
}
