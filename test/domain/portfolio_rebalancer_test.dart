import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const rebalancer = PortfolioRebalancer();

  group('PortfolioRebalancer', () {
    test('rebalance computes trades', () {
      final result = rebalancer.rebalance([
        const RebalanceHolding(
          ticker: 'AAPL',
          shares: 10,
          currentPrice: 150,
          targetWeight: 0.60,
        ),
        const RebalanceHolding(
          ticker: 'MSFT',
          shares: 5,
          currentPrice: 300,
          targetWeight: 0.40,
        ),
      ]);
      // Total: 1500 + 1500 = 3000
      // AAPL current: 50%, target: 60% → need to buy
      // MSFT current: 50%, target: 40% → need to sell
      expect(result.trades.length, 2);
      final aapl = result.trades.firstWhere(
        (RebalanceTrade t) => t.ticker == 'AAPL',
      );
      expect(aapl.isBuy, isTrue);
      final msft = result.trades.firstWhere(
        (RebalanceTrade t) => t.ticker == 'MSFT',
      );
      expect(msft.isSell, isTrue);
    });

    test('turnoverPct reflects trading amount', () {
      final result = rebalancer.rebalance([
        const RebalanceHolding(
          ticker: 'A',
          shares: 100,
          currentPrice: 10,
          targetWeight: 0.5,
        ),
        const RebalanceHolding(
          ticker: 'B',
          shares: 100,
          currentPrice: 10,
          targetWeight: 0.5,
        ),
      ]);
      // Already at 50/50 → turnover should be ~0
      expect(result.turnoverPct, closeTo(0, 0.01));
    });

    test('empty holdings returns empty result', () {
      final result = rebalancer.rebalance([]);
      expect(result.trades, isEmpty);
      expect(result.totalPortfolioValue, 0);
    });

    test('actionableOnly filters tiny deltas', () {
      final result = rebalancer.rebalance([
        const RebalanceHolding(
          ticker: 'A',
          shares: 100,
          currentPrice: 10,
          targetWeight: 0.5,
        ),
        const RebalanceHolding(
          ticker: 'B',
          shares: 100,
          currentPrice: 10,
          targetWeight: 0.5,
        ),
      ]);
      expect(result.actionableOnly, isEmpty);
    });
  });
}
