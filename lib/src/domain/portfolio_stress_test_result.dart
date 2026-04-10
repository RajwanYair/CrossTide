import 'package:equatable/equatable.dart';

/// Result of a scenario or stress test for a portfolio.
class PortfolioStressTestResult extends Equatable {
  const PortfolioStressTestResult({
    required this.scenarioName,
    required this.portfolioReturnPct,
    required this.maxDrawdownPct,
    required this.valueAtRisk95Pct,
    required this.testedAt,
  });

  final String scenarioName;

  /// Simulated portfolio return under the stress scenario.
  final double portfolioReturnPct;

  /// Maximum drawdown observed in the stress scenario.
  final double maxDrawdownPct;

  /// 95 % VaR under the stress scenario.
  final double valueAtRisk95Pct;

  final DateTime testedAt;

  /// Returns true when the scenario results in a negative portfolio return.
  bool get isLossScenario => portfolioReturnPct < 0;

  /// Returns true when drawdown exceeds 20 % (severe scenario).
  bool get isSevere => maxDrawdownPct > 20.0;

  @override
  List<Object?> get props => [
    scenarioName,
    portfolioReturnPct,
    maxDrawdownPct,
    valueAtRisk95Pct,
    testedAt,
  ];
}
