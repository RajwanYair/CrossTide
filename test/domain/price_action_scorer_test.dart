import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const scorer = PriceActionScorer();

  final candles = [
    for (int i = 0; i < 25; i++)
      DailyCandle(
        date: DateTime(2024, 1, 1).add(Duration(days: i)),
        open: 100.0 + i * 0.3,
        high: 101.0 + i * 0.3,
        low: 99.0 + i * 0.3,
        close: 100.5 + i * 0.3,
        volume: 1000000,
      ),
  ];

  group('PriceActionScorer', () {
    test('score returns bullish for rising prices', () {
      final result = scorer.score(ticker: 'AAPL', candles: candles);
      expect(result, isNotNull);
      expect(result!.bias, PriceActionBias.bullish);
      expect(result.score, greaterThan(0));
    });

    test('score returns bearish for falling prices', () {
      final falling = [
        for (int i = 0; i < 25; i++)
          DailyCandle(
            date: DateTime(2024, 1, 1).add(Duration(days: i)),
            open: 200.0 - i * 0.5,
            high: 201.0 - i * 0.5,
            low: 199.0 - i * 0.5,
            close: 199.5 - i * 0.5,
            volume: 1000000,
          ),
      ];
      final result = scorer.score(ticker: 'AAPL', candles: falling);
      expect(result, isNotNull);
      expect(result!.bias, PriceActionBias.bearish);
    });

    test('score returns null for insufficient data', () {
      final result = scorer.score(
        ticker: 'AAPL',
        candles: candles.sublist(0, 5),
      );
      expect(result, isNull);
    });

    test('sub-scores are bounded', () {
      final result = scorer.score(ticker: 'AAPL', candles: candles);
      expect(result!.trendScore, inInclusiveRange(-100, 100));
      expect(result.momentumScore, inInclusiveRange(-100, 100));
      expect(result.candleScore, inInclusiveRange(-100, 100));
    });
  });
}
