/// Custom Indicator Formula — declarative DSL for user-defined technical indicators.
library;

import 'package:equatable/equatable.dart';

/// The mathematical or technical operation applied in a formula step.
enum FormulaOperation {
  /// Simple moving average of a field over [period] bars.
  sma,

  /// Exponential moving average of a field over [period] bars.
  ema,

  /// Relative Strength Index of a field over [period] bars.
  rsi,

  /// MACD line (EMA12 − EMA26) applied to a field.
  macd,

  /// Ratio of two named outputs (outputA / outputB).
  ratio,

  /// Difference of two named outputs (outputA − outputB).
  subtract,

  /// Boolean: output > threshold value.
  crossAbove,

  /// Boolean: output < threshold value.
  crossBelow,
}

/// A single operand reference in a formula step.
class FormulaOperand extends Equatable {
  const FormulaOperand({required this.name, this.period});

  /// Name of the source field or a prior step's [FormulaStep.outputName].
  /// Built-in fields: 'close', 'open', 'high', 'low', 'volume'.
  final String name;

  /// Lookback period in bars (used for SMA, EMA, RSI, MACD operations).
  final int? period;

  @override
  List<Object?> get props => [name, period];
}

/// One computation step in a [CustomIndicatorFormula].
class FormulaStep extends Equatable {
  const FormulaStep({
    required this.operation,
    required this.operands,
    required this.outputName,
  });

  final FormulaOperation operation;

  /// One or two operands consumed by [operation].
  final List<FormulaOperand> operands;

  /// Name assigned to this step's output — referenced by later steps.
  final String outputName;

  @override
  List<Object?> get props => [operation, operands, outputName];
}

/// A named, reusable user-defined indicator formula.
///
/// Steps are evaluated in order; each step may reference the outputs of
/// any previously executed step via [FormulaOperand.name].
class CustomIndicatorFormula extends Equatable {
  const CustomIndicatorFormula({
    required this.id,
    required this.name,
    required this.steps,
    this.description,
  }) : assert(steps.length > 0, 'formula must have at least one step');

  /// Stable unique identifier (user-assigned slug, e.g. 'my_rsi_sma_cross').
  final String id;

  /// Human-readable display name.
  final String name;

  /// Ordered evaluation steps.
  final List<FormulaStep> steps;

  /// Optional human-readable description shown in the indicator picker.
  final String? description;

  /// Name of the final output value produced by this formula.
  String get outputName => steps.last.outputName;

  @override
  List<Object?> get props => [id, name, steps, description];
}
