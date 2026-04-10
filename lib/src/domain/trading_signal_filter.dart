import 'package:equatable/equatable.dart';

/// Direction in which a signal filter applies.
enum SignalFilterDirection { buyOnly, sellOnly, both }

/// A single filter rule for a signal stream.
class SignalFilterRule extends Equatable {
  const SignalFilterRule({
    required this.methodName,
    required this.direction,
    this.minConfidence = 0.0,
    this.requireConsensus = false,
  }) : assert(
         minConfidence >= 0.0 && minConfidence <= 1.0,
         'minConfidence must be 0.0–1.0',
       );

  final String methodName;
  final SignalFilterDirection direction;
  final double minConfidence;
  final bool requireConsensus;

  bool get appliesToBuy =>
      direction == SignalFilterDirection.buyOnly ||
      direction == SignalFilterDirection.both;

  bool get appliesToSell =>
      direction == SignalFilterDirection.sellOnly ||
      direction == SignalFilterDirection.both;

  @override
  List<Object?> get props => [
    methodName,
    direction,
    minConfidence,
    requireConsensus,
  ];
}

/// A chain of filters applied to a trading signal stream before delivery.
class TradingSignalFilter extends Equatable {
  const TradingSignalFilter({
    required this.name,
    required this.rules,
    this.logFiltered = false,
  });

  final String name;
  final List<SignalFilterRule> rules;
  final bool logFiltered;

  bool get isEmpty => rules.isEmpty;
  int get ruleCount => rules.length;

  bool get hasConsensusRequirement =>
      rules.any((final SignalFilterRule r) => r.requireConsensus);

  /// Returns filter rules that apply to buy signals.
  List<SignalFilterRule> get buyRules =>
      rules.where((final SignalFilterRule r) => r.appliesToBuy).toList();

  /// Returns filter rules that apply to sell signals.
  List<SignalFilterRule> get sellRules =>
      rules.where((final SignalFilterRule r) => r.appliesToSell).toList();

  TradingSignalFilter withRule(SignalFilterRule rule) => TradingSignalFilter(
    name: name,
    rules: [...rules, rule],
    logFiltered: logFiltered,
  );

  @override
  List<Object?> get props => [name, rules, logFiltered];
}
