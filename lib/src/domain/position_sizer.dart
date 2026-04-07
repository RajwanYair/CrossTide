/// Position Sizer — computes optimal position size based on account risk,
/// stop-loss distance, and optional Kelly criterion.
library;

import 'dart:math' as math;

import 'package:equatable/equatable.dart';

/// Position sizing result.
class FixedRiskResult extends Equatable {
  const FixedRiskResult({
    required this.shares,
    required this.dollarRisk,
    required this.positionValue,
    required this.riskPercentOfAccount,
  });

  /// Recommended number of shares.
  final int shares;

  /// Dollar risk per trade.
  final double dollarRisk;

  /// Total position value.
  final double positionValue;

  /// Actual risk as percentage of account.
  final double riskPercentOfAccount;

  @override
  List<Object?> get props => [
    shares,
    dollarRisk,
    positionValue,
    riskPercentOfAccount,
  ];
}

/// Kelly criterion result.
class KellyResult extends Equatable {
  const KellyResult({
    required this.fullKelly,
    required this.halfKelly,
    required this.quarterKelly,
  });

  /// Full Kelly fraction (0–1).
  final double fullKelly;

  /// Half-Kelly fraction (safer).
  final double halfKelly;

  /// Quarter-Kelly fraction (safest).
  final double quarterKelly;

  @override
  List<Object?> get props => [fullKelly, halfKelly, quarterKelly];
}

/// Computes position sizing.
class PositionSizer {
  const PositionSizer();

  /// Fixed-risk position sizing.
  ///
  /// [accountSize] is total account value.
  /// [riskPercent] is max risk per trade (e.g. 1.0 = 1%).
  /// [entryPrice] is the planned entry price.
  /// [stopLoss] is the stop-loss price.
  FixedRiskResult fixedRisk({
    required double accountSize,
    required double riskPercent,
    required double entryPrice,
    required double stopLoss,
  }) {
    final riskPerShare = (entryPrice - stopLoss).abs();
    if (riskPerShare <= 0 || accountSize <= 0) {
      return const FixedRiskResult(
        shares: 0,
        dollarRisk: 0,
        positionValue: 0,
        riskPercentOfAccount: 0,
      );
    }

    final dollarRisk = accountSize * (riskPercent / 100);
    final shares = (dollarRisk / riskPerShare).floor();
    final actualRisk = shares * riskPerShare;
    final posValue = shares * entryPrice;

    return FixedRiskResult(
      shares: shares,
      dollarRisk: actualRisk,
      positionValue: posValue,
      riskPercentOfAccount: accountSize > 0
          ? (actualRisk / accountSize) * 100
          : 0,
    );
  }

  /// Kelly criterion for optimal bet sizing.
  ///
  /// [winRate] is historical win rate (0–1).
  /// [avgWin] is average winning trade amount.
  /// [avgLoss] is average losing trade amount (positive number).
  KellyResult kelly({
    required double winRate,
    required double avgWin,
    required double avgLoss,
  }) {
    if (avgLoss <= 0 || winRate <= 0 || winRate >= 1) {
      return const KellyResult(fullKelly: 0, halfKelly: 0, quarterKelly: 0);
    }

    final winLossRatio = avgWin / avgLoss;
    final full = winRate - ((1 - winRate) / winLossRatio);
    final clamped = math.max(0.0, math.min(1.0, full));

    return KellyResult(
      fullKelly: clamped,
      halfKelly: clamped / 2,
      quarterKelly: clamped / 4,
    );
  }
}
