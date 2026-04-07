/// Portfolio Rebalancer — computes the trades needed to bring
/// a portfolio from current weights back to target weights.
library;

import 'package:equatable/equatable.dart';

/// A rebalance action for one asset.
class RebalanceTrade extends Equatable {
  const RebalanceTrade({
    required this.ticker,
    required this.currentWeight,
    required this.targetWeight,
    required this.deltaWeight,
    required this.deltaShares,
    required this.estimatedValue,
  });

  final String ticker;

  /// Current weight (0–1).
  final double currentWeight;

  /// Target weight (0–1).
  final double targetWeight;

  /// Weight difference (target − current). Positive = buy, negative = sell.
  final double deltaWeight;

  /// Estimated shares to trade (positive = buy, negative = sell).
  final double deltaShares;

  /// Estimated dollar value of the trade.
  final double estimatedValue;

  /// Whether this is a buy order.
  bool get isBuy => deltaShares > 0;

  /// Whether this is a sell order.
  bool get isSell => deltaShares < 0;

  @override
  List<Object?> get props => [
    ticker,
    currentWeight,
    targetWeight,
    deltaWeight,
    deltaShares,
    estimatedValue,
  ];
}

/// Result of rebalance calculation.
class RebalanceResult extends Equatable {
  const RebalanceResult({
    required this.trades,
    required this.totalPortfolioValue,
    required this.totalTurnover,
  });

  final List<RebalanceTrade> trades;
  final double totalPortfolioValue;

  /// Sum of absolute trade values (measures how much trading is needed).
  final double totalTurnover;

  /// Turnover as a fraction of portfolio value.
  double get turnoverPct =>
      totalPortfolioValue > 0 ? (totalTurnover / totalPortfolioValue) * 100 : 0;

  /// Only the trades where action is needed (delta significant).
  List<RebalanceTrade> get actionableOnly =>
      trades.where((RebalanceTrade t) => t.deltaShares.abs() > 0.01).toList();

  @override
  List<Object?> get props => [trades, totalPortfolioValue, totalTurnover];
}

/// Holding input for rebalancing.
class RebalanceHolding extends Equatable {
  const RebalanceHolding({
    required this.ticker,
    required this.shares,
    required this.currentPrice,
    required this.targetWeight,
  });

  final String ticker;
  final double shares;
  final double currentPrice;

  /// Desired weight (0–1).
  final double targetWeight;

  double get marketValue => shares * currentPrice;

  @override
  List<Object?> get props => [ticker, shares, currentPrice, targetWeight];
}

/// Computes rebalance trades.
class PortfolioRebalancer {
  const PortfolioRebalancer();

  /// Compute rebalance trades from current holdings to target weights.
  RebalanceResult rebalance(List<RebalanceHolding> holdings) {
    if (holdings.isEmpty) {
      return const RebalanceResult(
        trades: [],
        totalPortfolioValue: 0,
        totalTurnover: 0,
      );
    }

    var totalValue = 0.0;
    for (final RebalanceHolding h in holdings) {
      totalValue += h.marketValue;
    }

    if (totalValue <= 0) {
      return const RebalanceResult(
        trades: [],
        totalPortfolioValue: 0,
        totalTurnover: 0,
      );
    }

    final trades = <RebalanceTrade>[];
    var turnover = 0.0;

    for (final RebalanceHolding h in holdings) {
      final currentWeight = h.marketValue / totalValue;
      final deltaWeight = h.targetWeight - currentWeight;
      final deltaValue = deltaWeight * totalValue;
      final deltaShares = h.currentPrice > 0 ? deltaValue / h.currentPrice : 0;

      turnover += deltaValue.abs();

      trades.add(
        RebalanceTrade(
          ticker: h.ticker,
          currentWeight: currentWeight,
          targetWeight: h.targetWeight,
          deltaWeight: deltaWeight,
          deltaShares: deltaShares.toDouble(),
          estimatedValue: deltaValue.abs(),
        ),
      );
    }

    return RebalanceResult(
      trades: trades,
      totalPortfolioValue: totalValue,
      totalTurnover: turnover,
    );
  }
}
