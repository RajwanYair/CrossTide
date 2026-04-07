import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const SmaProximityRanker ranker = SmaProximityRanker();

  List<DailyCandle> makeCandles(int count, double close) => [
    for (int i = 0; i < count; i++)
      DailyCandle(
        date: DateTime(2024, 1, 1).add(Duration(days: i)),
        open: close,
        high: close + 1,
        low: close - 1,
        close: close,
        volume: 1000,
      ),
  ];

  group('SmaProximityRanker', () {
    test('compute returns null for empty candles', () {
      expect(ranker.compute(symbol: 'AAPL', candles: []), isNull);
    });

    test('compute returns null when insufficient candles for period', () {
      final List<DailyCandle> candles = makeCandles(10, 100);
      expect(ranker.compute(symbol: 'AAPL', candles: candles), isNull);
    });

    test('compute returns proximity for sufficient candles', () {
      // 200 candles at 100, SMA200 = 100. Last close = 100.
      // Distance = 0%.
      final List<DailyCandle> candles = makeCandles(200, 100);
      final SmaProximity? result = ranker.compute(
        symbol: 'AAPL',
        candles: candles,
      );
      expect(result, isNotNull);
      expect(result!.symbol, 'AAPL');
      expect(result.distancePct, closeTo(0, 0.01));
      expect(result.isAbove, isFalse);
      expect(result.isNear(), isTrue);
    });

    test('compute detects above SMA', () {
      // 200 candles at 100, then append 1 at 110.
      final List<DailyCandle> candles = [
        ...makeCandles(199, 100),
        DailyCandle(
          date: DateTime(2024, 7, 18),
          open: 110,
          high: 111,
          low: 109,
          close: 110,
          volume: 1000,
        ),
      ];
      final SmaProximity? result = ranker.compute(
        symbol: 'AAPL',
        candles: candles,
      );
      expect(result, isNotNull);
      expect(result!.isAbove, isTrue);
      expect(result.distancePct, greaterThan(0));
    });

    test('isNear with custom threshold', () {
      const SmaProximity prox = SmaProximity(
        symbol: 'AAPL',
        lastClose: 103,
        smaValue: 100,
        distancePct: 3,
      );
      expect(prox.isNear(thresholdPct: 2), isFalse);
      expect(prox.isNear(thresholdPct: 5), isTrue);
    });

    test('rankByProximity sorts by absolute distance', () {
      final Map<String, List<DailyCandle>> data = {
        'A': [
          ...makeCandles(199, 100),
          DailyCandle(
            date: DateTime(2024, 7, 18),
            open: 110,
            high: 111,
            low: 109,
            close: 110,
            volume: 1000,
          ),
        ],
        'B': makeCandles(200, 100),
      };
      final List<SmaProximity> ranked = ranker.rankByProximity(data);
      // B is at 0% distance, A is at ~10% distance
      expect(ranked.first.symbol, 'B');
      expect(ranked.last.symbol, 'A');
    });

    test('rankByProximity skips tickers with insufficient data', () {
      final Map<String, List<DailyCandle>> data = {
        'A': makeCandles(200, 100),
        'B': makeCandles(5, 100),
      };
      final List<SmaProximity> ranked = ranker.rankByProximity(data);
      expect(ranked.length, 1);
      expect(ranked.first.symbol, 'A');
    });

    test('SmaProximity equality', () {
      const SmaProximity a = SmaProximity(
        symbol: 'AAPL',
        lastClose: 100,
        smaValue: 100,
        distancePct: 0,
      );
      const SmaProximity b = SmaProximity(
        symbol: 'AAPL',
        lastClose: 100,
        smaValue: 100,
        distancePct: 0,
      );
      expect(a, equals(b));
    });
  });
}
