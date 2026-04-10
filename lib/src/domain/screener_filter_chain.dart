import 'package:equatable/equatable.dart';

/// Logical operator for combining filter steps.
enum FilterChainOperator { and, or }

/// A single screener filter step: one field, one comparator, one threshold.
class ScreenerFilterStep extends Equatable {
  const ScreenerFilterStep({
    required this.fieldName,
    required this.comparator,
    required this.threshold,
  });

  /// Name of the field to test (e.g. 'rsi', 'marketCap', 'pctFromSma200').
  final String fieldName;

  /// Comparison operator string: '>', '>=', '<', '<=', '==', '!='.
  final String comparator;

  /// Numeric threshold value.
  final double threshold;

  @override
  List<Object?> get props => [fieldName, comparator, threshold];
}

/// An ordered chain of filter steps with a combining operator.
class ScreenerFilterChain extends Equatable {
  const ScreenerFilterChain({
    required this.chainId,
    required this.label,
    required this.steps,
    this.operator = FilterChainOperator.and,
  });

  final String chainId;
  final String label;
  final List<ScreenerFilterStep> steps;

  /// Whether all steps must pass (AND) or only one (OR).
  final FilterChainOperator operator;

  bool get isEmpty => steps.isEmpty;
  int get stepCount => steps.length;

  /// Returns a new chain with [step] appended.
  ScreenerFilterChain withStep(ScreenerFilterStep step) => ScreenerFilterChain(
    chainId: chainId,
    label: label,
    steps: [...steps, step],
    operator: operator,
  );

  /// Returns a new chain with [operator] replaced.
  ScreenerFilterChain withOperator(FilterChainOperator op) =>
      ScreenerFilterChain(
        chainId: chainId,
        label: label,
        steps: steps,
        operator: op,
      );

  @override
  List<Object?> get props => [chainId, label, steps, operator];
}
