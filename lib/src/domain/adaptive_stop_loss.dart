import 'package:equatable/equatable.dart';

/// Adaptive stop loss — dynamically adjusted stop with ATR/volatility rule.
enum StopLossAdaptationRule {
  trailingAtr,
  fixedPercent,
  volatilityBased,
  supportLevel,
}

class AdaptiveStopLoss extends Equatable {
  const AdaptiveStopLoss({
    required this.ticker,
    required this.entryPrice,
    required this.stopPrice,
    required this.adaptationRule,
    required this.isTriggered,
  });

  final String ticker;
  final double entryPrice;
  final double stopPrice;
  final StopLossAdaptationRule adaptationRule;
  final bool isTriggered;

  AdaptiveStopLoss copyWith({
    String? ticker,
    double? entryPrice,
    double? stopPrice,
    StopLossAdaptationRule? adaptationRule,
    bool? isTriggered,
  }) => AdaptiveStopLoss(
    ticker: ticker ?? this.ticker,
    entryPrice: entryPrice ?? this.entryPrice,
    stopPrice: stopPrice ?? this.stopPrice,
    adaptationRule: adaptationRule ?? this.adaptationRule,
    isTriggered: isTriggered ?? this.isTriggered,
  );

  @override
  List<Object?> get props => [
    ticker,
    entryPrice,
    stopPrice,
    adaptationRule,
    isTriggered,
  ];
}
