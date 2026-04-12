import 'package:equatable/equatable.dart';

/// Structured plan for recovering from a portfolio drawdown (S526).
class DrawdownRecoveryPlan extends Equatable {
  const DrawdownRecoveryPlan({
    required this.planId,
    required this.portfolioId,
    required this.drawdownPercent,
    required this.targetRecoveryPercent,
    required this.requiredReturnPercent,
    required this.estimatedRecoveryDays,
    this.isActive = true,
  });

  final String planId;
  final String portfolioId;

  /// The drawdown depth that triggered this plan (negative value).
  final double drawdownPercent;

  /// Target equity level as a percentage of pre-drawdown peak.
  final double targetRecoveryPercent;

  /// Portfolio return required to reach the target.
  final double requiredReturnPercent;

  /// Estimated trading days to recovery at historical average return.
  final int estimatedRecoveryDays;
  final bool isActive;

  bool get isDeepDrawdown => drawdownPercent <= -20;
  bool get isLongRecovery => estimatedRecoveryDays > 365;
  bool get hasHighRequiredReturn => requiredReturnPercent >= 30;

  @override
  List<Object?> get props => [
    planId,
    portfolioId,
    drawdownPercent,
    targetRecoveryPercent,
    requiredReturnPercent,
    estimatedRecoveryDays,
    isActive,
  ];
}
