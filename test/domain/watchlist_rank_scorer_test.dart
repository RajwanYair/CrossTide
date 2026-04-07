import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const scorer = WatchlistRankScorer();

  group('WatchlistRankScorer', () {
    test('ranks tickers by composite score', () {
      final inputs = [
        const TickerRankInput(
          ticker: 'AAPL',
          smaDistancePct: 5,
          rsi: 55,
          trendScore: 80,
          volatility: 0.2,
        ),
        const TickerRankInput(
          ticker: 'TSLA',
          smaDistancePct: 25,
          rsi: 75,
          trendScore: 40,
          volatility: 0.6,
        ),
        const TickerRankInput(
          ticker: 'MSFT',
          smaDistancePct: 3,
          rsi: 50,
          trendScore: 70,
          volatility: 0.15,
        ),
      ];

      final ranks = scorer.rank(inputs);
      expect(ranks, hasLength(3));
      expect(ranks[0].rank, 1);
      expect(ranks[1].rank, 2);
      expect(ranks[2].rank, 3);
      expect(
        ranks[0].compositeScore,
        greaterThanOrEqualTo(ranks[1].compositeScore),
      );
    });

    test('returns empty for empty input', () {
      expect(scorer.rank([]), isEmpty);
    });

    test('single ticker gets rank 1', () {
      final result = scorer.rank(const [
        TickerRankInput(
          ticker: 'GOOG',
          smaDistancePct: 8,
          rsi: 50,
          trendScore: 60,
          volatility: 0.3,
        ),
      ]);
      expect(result, hasLength(1));
      expect(result[0].rank, 1);
      expect(result[0].ticker, 'GOOG');
    });

    test('TickerRank equality', () {
      const a = TickerRank(
        ticker: 'X',
        rank: 1,
        compositeScore: 80,
        technicalScore: 90,
        momentumScore: 70,
        riskScore: 80,
      );
      const b = TickerRank(
        ticker: 'X',
        rank: 1,
        compositeScore: 80,
        technicalScore: 90,
        momentumScore: 70,
        riskScore: 80,
      );
      expect(a, equals(b));
    });
  });
}
