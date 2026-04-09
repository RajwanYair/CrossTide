/// Backtest Optimizer — parameter sweep over a configurable backtest strategy space.
library;

import 'package:equatable/equatable.dart';

/// The metric to maximise (or minimise for [maxDrawdown]) during a parameter sweep.
enum OptimizationMetric {
  /// Total percentage return over the backtest period.
  totalReturn,

  /// Annualised Sharpe ratio (higher = better).
  sharpeRatio,

  /// Maximum peak-to-trough drawdown — minimised during optimisation.
  maxDrawdown,

  /// Fraction of trades that were profitable.
  winRate,

  /// Gross profit divided by gross loss.
  profitFactor,
}

/// Defines a continuous parameter range to sweep with a given step size.
class ParameterRange extends Equatable {
  const ParameterRange({
    required this.name,
    required this.min,
    required this.max,
    required this.step,
  }) : assert(
            min <= max && step > 0,
            'ParameterRange: min must be ≤ max and step must be > 0');

  final String name;
  final double min;
  final double max;
  final double step;

  /// Number of discrete values in this range.
  int get stepCount => ((max - min) / step).floor() + 1;

  /// Returns all discrete values from [min] to [max] in [step] increments.
  List<double> values() {
    final result = <double>[];
    var v = min;
    while (v <= max + step * 0.001) {
      result.add(v);
      v += step;
    }
    return result;
  }

  @override
  List<Object?> get props => [name, min, max, step];
}

/// Result of a single parameter combination evaluated during a sweep.
class SweepResult extends Equatable {
  const SweepResult({
    required this.parameters,
    required this.metric,
    required this.value,
    required this.tradeCount,
  });

  /// Parameter name → value mapping for this combination.
  final Map<String, double> parameters;
  final OptimizationMetric metric;

  /// The metric value achieved with these parameters.
  final double value;

  /// Number of trades executed in the simulation.
  final int tradeCount;

  @override
  List<Object?> get props => [parameters, metric, value, tradeCount];
}

/// Orchestrates a grid search over [parameterRanges] and selects the best result
/// for the chosen [optimizeFor] metric.
class BacktestOptimizer extends Equatable {
  const BacktestOptimizer({
    required this.parameterRanges,
    required this.optimizeFor,
  });

  final List<ParameterRange> parameterRanges;
  final OptimizationMetric optimizeFor;

  /// Total number of parameter combinations in the grid.
  int get totalCombinations => parameterRanges.fold(
        1,
        (int acc, ParameterRange r) => acc * r.stepCount,
      );

  /// Returns the best [SweepResult] from [results] according to [optimizeFor].
  /// Returns null if [results] is empty.
  SweepResult? bestOf(List<SweepResult> results) {
    if (results.isEmpty) return null;
    return results.reduce(
      (SweepResult a, SweepResult b) =>
          optimizeFor == OptimizationMetric.maxDrawdown
              ? (a.value < b.value ? a : b)
              : (a.value > b.value ? a : b),
    );
  }

  @override
  List<Object?> get props => [parameterRanges, optimizeFor];
}
