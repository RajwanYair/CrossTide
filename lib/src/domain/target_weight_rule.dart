import 'package:equatable/equatable.dart';

/// Target weight rule — per-ticker rebalance weight with drift trigger.
enum WeightAdjustmentTrigger {
  driftExceeded,
  rebalanceDate,
  signalTriggered,
  manual,
}

class TargetWeightRule extends Equatable {
  const TargetWeightRule({
    required this.ruleId,
    required this.ticker,
    required this.targetWeightPct,
    required this.tolerancePct,
    required this.trigger,
  });

  final String ruleId;
  final String ticker;
  final double targetWeightPct;
  final double tolerancePct;
  final WeightAdjustmentTrigger trigger;

  TargetWeightRule copyWith({
    String? ruleId,
    String? ticker,
    double? targetWeightPct,
    double? tolerancePct,
    WeightAdjustmentTrigger? trigger,
  }) => TargetWeightRule(
    ruleId: ruleId ?? this.ruleId,
    ticker: ticker ?? this.ticker,
    targetWeightPct: targetWeightPct ?? this.targetWeightPct,
    tolerancePct: tolerancePct ?? this.tolerancePct,
    trigger: trigger ?? this.trigger,
  );

  @override
  List<Object?> get props => [
    ruleId,
    ticker,
    targetWeightPct,
    tolerancePct,
    trigger,
  ];
}
