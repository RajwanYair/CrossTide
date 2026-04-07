/// Position Size Calculator — pure domain logic.
///
/// Computes how many shares to buy based on account size, risk
/// tolerance, and stop-loss distance. Implements fixed-fractional
/// and fixed-dollar risk sizing.
library;

import 'package:equatable/equatable.dart';

/// Result of position sizing.
class PositionSizeResult extends Equatable {
  const PositionSizeResult({
    required this.shares,
    required this.totalCost,
    required this.riskAmount,
    required this.riskPercent,
  });

  /// Number of shares to buy (whole shares only).
  final int shares;

  /// Total cost at entry price.
  final double totalCost;

  /// Dollar amount at risk (shares × risk-per-share).
  final double riskAmount;

  /// Percentage of account at risk.
  final double riskPercent;

  @override
  List<Object?> get props => [shares, totalCost, riskAmount, riskPercent];
}

/// Computes position sizes based on risk parameters.
class PositionSizeCalculator {
  const PositionSizeCalculator();

  /// Fixed-fractional sizing: risk a fixed % of account per trade.
  ///
  /// Returns null if inputs are invalid (≤ 0, stopLoss ≥ entry).
  PositionSizeResult? computeFixedFractional({
    required double accountSize,
    required double entryPrice,
    required double stopLoss,
    required double riskPercent,
  }) {
    if (accountSize <= 0 || entryPrice <= 0 || riskPercent <= 0) return null;
    if (stopLoss >= entryPrice) return null;

    final double riskPerShare = entryPrice - stopLoss;
    if (riskPerShare <= 0) return null;

    final double dollarsAtRisk = accountSize * (riskPercent / 100);
    final int shares = (dollarsAtRisk / riskPerShare).floor();

    if (shares <= 0) return null;

    return PositionSizeResult(
      shares: shares,
      totalCost: shares * entryPrice,
      riskAmount: shares * riskPerShare,
      riskPercent: (shares * riskPerShare / accountSize) * 100,
    );
  }

  /// Fixed-dollar sizing: risk a fixed dollar amount per trade.
  ///
  /// Returns null if inputs are invalid.
  PositionSizeResult? computeFixedDollar({
    required double accountSize,
    required double entryPrice,
    required double stopLoss,
    required double fixedRiskDollars,
  }) {
    if (accountSize <= 0 || entryPrice <= 0 || fixedRiskDollars <= 0) {
      return null;
    }
    if (stopLoss >= entryPrice) return null;

    final double riskPerShare = entryPrice - stopLoss;
    if (riskPerShare <= 0) return null;

    final int shares = (fixedRiskDollars / riskPerShare).floor();
    if (shares <= 0) return null;

    return PositionSizeResult(
      shares: shares,
      totalCost: shares * entryPrice,
      riskAmount: shares * riskPerShare,
      riskPercent: (shares * riskPerShare / accountSize) * 100,
    );
  }
}
