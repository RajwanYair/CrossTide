/// Risk–Reward Calculator — pure domain logic.
///
/// Given an entry price, stop-loss, and target price, computes the
/// risk–reward ratio and related position-sizing metrics.
library;

import 'package:equatable/equatable.dart';

/// Result of a risk–reward calculation.
class RiskRewardResult extends Equatable {
  const RiskRewardResult({
    required this.entryPrice,
    required this.stopLoss,
    required this.targetPrice,
    required this.riskPercent,
    required this.rewardPercent,
    required this.ratio,
  });

  /// Entry (buy/sell) price.
  final double entryPrice;

  /// Stop-loss price.
  final double stopLoss;

  /// Target (take-profit) price.
  final double targetPrice;

  /// Downside risk as a percentage of entry.
  final double riskPercent;

  /// Upside reward as a percentage of entry.
  final double rewardPercent;

  /// Reward ÷ Risk. Higher is better (≥ 2 is common minimum).
  final double ratio;

  @override
  List<Object?> get props => [
    entryPrice,
    stopLoss,
    targetPrice,
    riskPercent,
    rewardPercent,
    ratio,
  ];
}

/// Computes risk–reward metrics for a trade setup.
class RiskRewardCalculator {
  const RiskRewardCalculator();

  /// Compute risk–reward for a **long** trade.
  ///
  /// Returns null if entry ≤ 0, stopLoss ≥ entry, or target ≤ entry.
  RiskRewardResult? computeLong({
    required double entryPrice,
    required double stopLoss,
    required double targetPrice,
  }) {
    if (entryPrice <= 0) return null;
    if (stopLoss >= entryPrice) return null;
    if (targetPrice <= entryPrice) return null;

    final double risk = entryPrice - stopLoss;
    final double reward = targetPrice - entryPrice;

    return RiskRewardResult(
      entryPrice: entryPrice,
      stopLoss: stopLoss,
      targetPrice: targetPrice,
      riskPercent: (risk / entryPrice) * 100,
      rewardPercent: (reward / entryPrice) * 100,
      ratio: reward / risk,
    );
  }

  /// Compute risk–reward for a **short** trade.
  ///
  /// Returns null if entry ≤ 0, stopLoss ≤ entry, or target ≥ entry.
  RiskRewardResult? computeShort({
    required double entryPrice,
    required double stopLoss,
    required double targetPrice,
  }) {
    if (entryPrice <= 0) return null;
    if (stopLoss <= entryPrice) return null;
    if (targetPrice >= entryPrice) return null;

    final double risk = stopLoss - entryPrice;
    final double reward = entryPrice - targetPrice;

    return RiskRewardResult(
      entryPrice: entryPrice,
      stopLoss: stopLoss,
      targetPrice: targetPrice,
      riskPercent: (risk / entryPrice) * 100,
      rewardPercent: (reward / entryPrice) * 100,
      ratio: reward / risk,
    );
  }
}
