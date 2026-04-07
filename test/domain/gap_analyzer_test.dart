import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const analyzer = GapAnalyzer(minGapPct: 0.5);

  DailyCandle makeCandle(
    DateTime date,
    double open,
    double high,
    double low,
    double close, {
    int volume = 1000,
  }) {
    return DailyCandle(
      date: date,
      open: open,
      high: high,
      low: low,
      close: close,
      volume: volume,
    );
  }

  group('GapAnalyzer', () {
    test('detects gap up', () {
      final candles = [
        makeCandle(DateTime(2024, 1, 1), 100, 102, 98, 100),
        makeCandle(DateTime(2024, 1, 2), 101.5, 103, 101, 102),
      ];

      final result = analyzer.analyze(candles);
      expect(result.totalGaps, 1);
      expect(result.gaps[0].direction, AnalyzedGapDirection.up);
      expect(result.gaps[0].gapSizePct, closeTo(1.5, 0.1));
    });

    test('detects gap down', () {
      final candles = [
        makeCandle(DateTime(2024, 1, 1), 100, 102, 98, 100),
        makeCandle(DateTime(2024, 1, 2), 98, 99, 97, 98),
      ];

      final result = analyzer.analyze(candles);
      expect(result.totalGaps, 1);
      expect(result.gaps[0].direction, AnalyzedGapDirection.down);
    });

    test('detects filled gap', () {
      final candles = [
        makeCandle(DateTime(2024, 1, 1), 100, 102, 98, 100),
        makeCandle(DateTime(2024, 1, 2), 102, 104, 101, 103),
        makeCandle(DateTime(2024, 1, 3), 103, 103, 99, 100),
      ];

      final result = analyzer.analyze(candles);
      expect(result.gaps[0].filled, isTrue);
      expect(result.fillRate, 1.0);
    });

    test('ignores small gaps', () {
      final candles = [
        makeCandle(DateTime(2024, 1, 1), 100, 102, 98, 100),
        makeCandle(DateTime(2024, 1, 2), 100.3, 101, 99.5, 100.5),
      ];

      final result = analyzer.analyze(candles);
      expect(result.totalGaps, 0);
    });

    test('empty candles returns empty result', () {
      final result = analyzer.analyze([]);
      expect(result.totalGaps, 0);
      expect(result.avgGapSizePct, 0);
    });
  });
}
