import 'package:cross_tide/src/domain/market_liquidity_rating.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('MarketLiquidityRating', () {
    test('equality', () {
      final a = MarketLiquidityRating(
        ticker: 'AAPL',
        grade: LiquidityRatingGrade.high,
        compositeScore: 92.0,
        averageDailyVolumeM: 5800.0,
        bidAskSpreadBps: 1.2,
        amihudRatio: 0.0001,
        calculatedAt: DateTime(2025, 3, 1),
      );
      final b = MarketLiquidityRating(
        ticker: 'AAPL',
        grade: LiquidityRatingGrade.high,
        compositeScore: 92.0,
        averageDailyVolumeM: 5800.0,
        bidAskSpreadBps: 1.2,
        amihudRatio: 0.0001,
        calculatedAt: DateTime(2025, 3, 1),
      );
      expect(a, b);
    });

    test('copyWith changes compositeScore', () {
      final base = MarketLiquidityRating(
        ticker: 'AAPL',
        grade: LiquidityRatingGrade.high,
        compositeScore: 92.0,
        averageDailyVolumeM: 5800.0,
        bidAskSpreadBps: 1.2,
        amihudRatio: 0.0001,
        calculatedAt: DateTime(2025, 3, 1),
      );
      final updated = base.copyWith(compositeScore: 90.0);
      expect(updated.compositeScore, 90.0);
    });

    test('props length is 7', () {
      final obj = MarketLiquidityRating(
        ticker: 'AAPL',
        grade: LiquidityRatingGrade.high,
        compositeScore: 92.0,
        averageDailyVolumeM: 5800.0,
        bidAskSpreadBps: 1.2,
        amihudRatio: 0.0001,
        calculatedAt: DateTime(2025, 3, 1),
      );
      expect(obj.props.length, 7);
    });
  });
}
