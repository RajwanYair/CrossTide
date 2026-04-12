import 'package:cross_tide/src/domain/portfolio_turnover_metric.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('PortfolioTurnoverMetric', () {
    test('equality', () {
      final a = PortfolioTurnoverMetric(
        portfolioId: 'p1',
        annualisedTurnoverPercent: 45.0,
        totalBuyValueBase: 50000.0,
        totalSellValueBase: 48000.0,
        averageHoldingDays: 180.0,
        calculatedAt: DateTime(2025, 2, 1),
      );
      final b = PortfolioTurnoverMetric(
        portfolioId: 'p1',
        annualisedTurnoverPercent: 45.0,
        totalBuyValueBase: 50000.0,
        totalSellValueBase: 48000.0,
        averageHoldingDays: 180.0,
        calculatedAt: DateTime(2025, 2, 1),
      );
      expect(a, b);
    });

    test('copyWith changes annualisedTurnoverPercent', () {
      final base = PortfolioTurnoverMetric(
        portfolioId: 'p1',
        annualisedTurnoverPercent: 45.0,
        totalBuyValueBase: 50000.0,
        totalSellValueBase: 48000.0,
        averageHoldingDays: 180.0,
        calculatedAt: DateTime(2025, 2, 1),
      );
      final updated = base.copyWith(annualisedTurnoverPercent: 50.0);
      expect(updated.annualisedTurnoverPercent, 50.0);
    });

    test('props length is 6', () {
      final obj = PortfolioTurnoverMetric(
        portfolioId: 'p1',
        annualisedTurnoverPercent: 45.0,
        totalBuyValueBase: 50000.0,
        totalSellValueBase: 48000.0,
        averageHoldingDays: 180.0,
        calculatedAt: DateTime(2025, 2, 1),
      );
      expect(obj.props.length, 6);
    });
  });
}
