/// Composite Alert Rule Builder — Pure domain logic.
///
/// Extends the existing [AlertRuleEvaluator] with composite, multi-condition
/// rules that combine consensus state, technical indicators, and volume data.
///
/// Example rule: IF consensus == GREEN AND volume > 2× avg AND RSI < 70 THEN alert.
library;

import 'package:equatable/equatable.dart';

/// Operators for combining conditions.
enum CompositeOp { and, or }

/// A single condition within a composite rule.
class RuleCondition extends Equatable {
  const RuleCondition({
    required this.field,
    required this.operator,
    required this.value,
  });

  /// The data field to check (e.g. 'consensus', 'rsi', 'volume_ratio').
  final String field;

  /// Comparison operator: '==', '!=', '>', '<', '>=', '<='.
  final String operator;

  /// The threshold value to compare against.
  final double value;

  /// Evaluate this condition against a context map.
  bool evaluate(Map<String, double> context) {
    final double? actual = context[field];
    if (actual == null) return false;

    return switch (operator) {
      '==' => actual == value,
      '!=' => actual != value,
      '>' => actual > value,
      '<' => actual < value,
      '>=' => actual >= value,
      '<=' => actual <= value,
      _ => false,
    };
  }

  @override
  List<Object?> get props => [field, operator, value];
}

/// A named composite alert rule with multiple conditions.
class CompositeAlertRule extends Equatable {
  const CompositeAlertRule({
    required this.name,
    required this.conditions,
    this.combineWith = CompositeOp.and,
    this.description,
    this.isEnabled = true,
  });

  final String name;
  final List<RuleCondition> conditions;
  final CompositeOp combineWith;
  final String? description;
  final bool isEnabled;

  /// Evaluate all conditions against the given context.
  bool evaluate(Map<String, double> context) {
    if (!isEnabled || conditions.isEmpty) return false;

    if (combineWith == CompositeOp.and) {
      return conditions.every((RuleCondition c) => c.evaluate(context));
    } else {
      return conditions.any((RuleCondition c) => c.evaluate(context));
    }
  }

  @override
  List<Object?> get props => [
    name,
    conditions,
    combineWith,
    description,
    isEnabled,
  ];
}

/// Result of evaluating a composite rule.
class CompositeRuleResult extends Equatable {
  const CompositeRuleResult({
    required this.ruleName,
    required this.triggered,
    required this.conditionResults,
  });

  final String ruleName;
  final bool triggered;

  /// Per-condition evaluation results (parallel to rule's conditions list).
  final List<bool> conditionResults;

  /// How many conditions passed.
  int get passedCount => conditionResults.where((bool r) => r).length;

  @override
  List<Object?> get props => [ruleName, triggered, conditionResults];
}

/// Evaluates composite alert rules against market data context.
class CompositeAlertRuleEvaluator {
  const CompositeAlertRuleEvaluator();

  /// Evaluate a single rule and return a detailed result.
  CompositeRuleResult evaluate(
    CompositeAlertRule rule,
    Map<String, double> context,
  ) {
    final List<bool> results = rule.conditions
        .map((RuleCondition c) => c.evaluate(context))
        .toList();

    return CompositeRuleResult(
      ruleName: rule.name,
      triggered: rule.evaluate(context),
      conditionResults: results,
    );
  }

  /// Evaluate multiple rules and return only the triggered ones.
  List<CompositeRuleResult> evaluateAll(
    List<CompositeAlertRule> rules,
    Map<String, double> context,
  ) {
    final List<CompositeRuleResult> results = [];
    for (final CompositeAlertRule rule in rules) {
      final CompositeRuleResult result = evaluate(rule, context);
      if (result.triggered) {
        results.add(result);
      }
    }
    return results;
  }
}
