import 'package:equatable/equatable.dart';

/// Severity level for a drawdown budget breach.
enum DrawdownBudgetLevel {
  /// Within acceptable drawdown tolerance.
  safe,

  /// Minor breach — monitor closely.
  caution,

  /// Material breach — consider de-risking.
  warning,

  /// Severe breach — immediate action required.
  critical,
}

/// Defines a drawdown budget relative to a portfolio's peak equity.
class DrawdownBudget extends Equatable {
  /// Creates a [DrawdownBudget].
  const DrawdownBudget({
    required this.portfolioId,
    required this.maxDrawdownPercent,
    required this.currentDrawdownPercent,
    required this.level,
  });

  /// Portfolio identifier.
  final String portfolioId;

  /// Maximum tolerated drawdown as a percentage of peak equity.
  final double maxDrawdownPercent;

  /// Actual current drawdown from peak.
  final double currentDrawdownPercent;

  /// Severity classification.
  final DrawdownBudgetLevel level;

  /// Returns `true` when the current drawdown exceeds the budget.
  bool get isBreached => currentDrawdownPercent > maxDrawdownPercent;

  /// Remaining headroom before budget is breached.
  double get remainingBudget =>
      isBreached ? 0.0 : maxDrawdownPercent - currentDrawdownPercent;

  /// Returns `true` when the budget is critically breached.
  bool get isCritical => level == DrawdownBudgetLevel.critical;

  @override
  List<Object?> get props => [
    portfolioId,
    maxDrawdownPercent,
    currentDrawdownPercent,
    level,
  ];
}
