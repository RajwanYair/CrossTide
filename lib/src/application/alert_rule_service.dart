/// Alert Rule Service — application-layer orchestration.
///
/// Evaluates user-defined [AlertRule] objects against live market data via
/// [AlertRuleEvaluator] and collects the triggered rules per ticker.
library;

import '../domain/domain.dart';

/// Orchestrates alert rule evaluation across all tickers.
class AlertRuleService {
  const AlertRuleService({
    AlertRuleEvaluator evaluator = const AlertRuleEvaluator(),
  }) : _evaluator = evaluator;

  final AlertRuleEvaluator _evaluator;

  /// Evaluate a single rule against a context.
  RuleEvaluationResult evaluate(AlertRule rule, RuleContext context) {
    return _evaluator.evaluate(rule, context);
  }

  /// Evaluate all [rules] against a single ticker's context.
  /// Returns the list of triggered results.
  List<RuleEvaluationResult> evaluateAll(
    List<AlertRule> rules,
    RuleContext context,
  ) {
    return _evaluator.evaluateAll(rules, context);
  }

  /// Scan multiple tickers against their rules.
  /// Returns a map of ticker → triggered results.
  Map<String, List<RuleEvaluationResult>> scanWatchlist(
    Map<String, RuleContext> tickerContexts,
    List<AlertRule> rules,
  ) {
    final Map<String, List<RuleEvaluationResult>> results = {};
    for (final MapEntry<String, RuleContext> entry in tickerContexts.entries) {
      final List<RuleEvaluationResult> triggered = evaluateAll(
        rules,
        entry.value,
      );
      if (triggered.isNotEmpty) {
        results[entry.key] = triggered;
      }
    }
    return results;
  }
}
