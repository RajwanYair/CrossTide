import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('DashboardSummary', () {
    test('bullishPercent calculation', () {
      final DashboardSummary summary = DashboardSummary(
        totalTickers: 10,
        tickersAboveSma200: 7,
        tickersBelowSma200: 3,
        tickersNearSma200: 2,
        recentCrossUpCount: 1,
        recentCrossDownCount: 0,
        consensusBuyCount: 2,
        consensusSellCount: 0,
        asOf: DateTime(2024, 6, 1),
      );
      expect(summary.bullishPercent, 70);
      expect(summary.isBullishBias, isTrue);
    });

    test('bullishPercent is zero when no tickers', () {
      final DashboardSummary summary = DashboardSummary(
        totalTickers: 0,
        tickersAboveSma200: 0,
        tickersBelowSma200: 0,
        tickersNearSma200: 0,
        recentCrossUpCount: 0,
        recentCrossDownCount: 0,
        consensusBuyCount: 0,
        consensusSellCount: 0,
        asOf: DateTime(2024, 6, 1),
      );
      expect(summary.bullishPercent, 0);
    });

    test('bearish bias when below exceeds above', () {
      final DashboardSummary summary = DashboardSummary(
        totalTickers: 10,
        tickersAboveSma200: 3,
        tickersBelowSma200: 7,
        tickersNearSma200: 2,
        recentCrossUpCount: 0,
        recentCrossDownCount: 2,
        consensusBuyCount: 0,
        consensusSellCount: 1,
        asOf: DateTime(2024, 6, 1),
      );
      expect(summary.isBullishBias, isFalse);
    });

    test('equality via Equatable', () {
      final DashboardSummary a = DashboardSummary(
        totalTickers: 5,
        tickersAboveSma200: 3,
        tickersBelowSma200: 2,
        tickersNearSma200: 1,
        recentCrossUpCount: 1,
        recentCrossDownCount: 0,
        consensusBuyCount: 1,
        consensusSellCount: 0,
        asOf: DateTime(2024, 6, 1),
      );
      final DashboardSummary b = DashboardSummary(
        totalTickers: 5,
        tickersAboveSma200: 3,
        tickersBelowSma200: 2,
        tickersNearSma200: 1,
        recentCrossUpCount: 1,
        recentCrossDownCount: 0,
        consensusBuyCount: 1,
        consensusSellCount: 0,
        asOf: DateTime(2024, 6, 1),
      );
      expect(a, equals(b));
    });
  });
}
