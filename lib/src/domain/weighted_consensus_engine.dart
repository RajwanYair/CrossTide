/// Weighted Consensus Engine — Enhanced consensus with per-method weights.
///
/// Extends the binary vote model of [ConsensusEngine] by assigning configurable
/// weights (0.0–1.0) to each trading method. A method's contribution scales with
/// its weight instead of being a simple 1-vote count.
///
/// **Weighted BUY consensus**: Micho BUY triggered AND the sum of other
/// triggered BUY method weights >= [threshold] (default 0.5).
///
/// **Weighted SELL consensus**: Micho SELL triggered AND the sum of other
/// triggered SELL method weights >= [threshold].
library;

import 'package:equatable/equatable.dart';

import 'entities.dart';
import 'micho_method_detector.dart';

/// Per-method weight assignment.
class MethodWeight extends Equatable {
  const MethodWeight({required this.methodName, required this.weight});

  /// The method's name (must match [MethodSignal.methodName]).
  final String methodName;

  /// Weight in [0.0, 1.0]. 0 = disabled, 1.0 = full weight.
  final double weight;

  /// Whether this method participates in consensus.
  bool get isEnabled => weight > 0;

  @override
  List<Object?> get props => [methodName, weight];
}

/// Configuration for the weighted consensus engine.
class WeightedConsensusConfig extends Equatable {
  const WeightedConsensusConfig({required this.weights, this.threshold = 0.5});

  /// Default config: equal weight (1.0) for every known method.
  factory WeightedConsensusConfig.defaultWeights() {
    return const WeightedConsensusConfig(
      weights: [
        MethodWeight(methodName: 'RSI Method', weight: 1.0),
        MethodWeight(methodName: 'MACD Crossover', weight: 1.0),
        MethodWeight(methodName: 'Bollinger Bands', weight: 1.0),
        MethodWeight(methodName: 'Stochastic', weight: 1.0),
        MethodWeight(methodName: 'OBV Divergence', weight: 1.0),
        MethodWeight(methodName: 'ADX Trend', weight: 1.0),
        MethodWeight(methodName: 'CCI', weight: 1.0),
        MethodWeight(methodName: 'Parabolic SAR', weight: 1.0),
        MethodWeight(methodName: 'Williams %R', weight: 1.0),
        MethodWeight(methodName: 'MFI', weight: 1.0),
        MethodWeight(methodName: 'SuperTrend', weight: 1.0),
      ],
    );
  }

  /// Per-method weights. Micho is always the primary and is not weighted.
  final List<MethodWeight> weights;

  /// Minimum aggregate weight of other methods required for consensus.
  /// Range: (0.0, total_weights]. Default 0.5 means any single method
  /// with weight >= 0.5 can trigger consensus alongside Micho.
  final double threshold;

  /// Look up the weight for a method by name. Returns 1.0 if not explicitly set.
  double weightFor(String methodName) {
    for (final MethodWeight w in weights) {
      if (w.methodName == methodName) return w.weight;
    }
    return 1.0;
  }

  @override
  List<Object?> get props => [weights, threshold];
}

/// Result from weighted consensus evaluation.
class WeightedConsensusResult extends Equatable {
  const WeightedConsensusResult({
    required this.ticker,
    required this.buySignal,
    required this.sellSignal,
    required this.buyMethods,
    required this.sellMethods,
    required this.buyWeightSum,
    required this.sellWeightSum,
    required this.threshold,
  });

  final String ticker;
  final MethodSignal? buySignal;
  final MethodSignal? sellSignal;
  final List<MethodSignal> buyMethods;
  final List<MethodSignal> sellMethods;

  /// Total weight of triggered BUY methods (excluding Micho).
  final double buyWeightSum;

  /// Total weight of triggered SELL methods (excluding Micho).
  final double sellWeightSum;

  /// The threshold used for this evaluation.
  final double threshold;

  bool get hasConsensus => buySignal != null || sellSignal != null;

  /// BUY confidence: ratio of triggered weight to max possible weight.
  double get buyConfidence =>
      threshold > 0 ? (buyWeightSum / threshold).clamp(0.0, 1.0) : 0.0;

  /// SELL confidence: ratio of triggered weight to max possible weight.
  double get sellConfidence =>
      threshold > 0 ? (sellWeightSum / threshold).clamp(0.0, 1.0) : 0.0;

  @override
  List<Object?> get props => [
    ticker,
    buySignal,
    sellSignal,
    buyMethods,
    sellMethods,
    buyWeightSum,
    sellWeightSum,
    threshold,
  ];
}

/// Weighted consensus engine — configurable method weights.
class WeightedConsensusEngine {
  const WeightedConsensusEngine();

  /// Evaluate weighted consensus from a flat list of method signals.
  WeightedConsensusResult evaluate({
    required String ticker,
    required List<MethodSignal> signals,
    required WeightedConsensusConfig config,
    required DateTime evaluatedAt,
  }) {
    final List<MethodSignal> buySignals = [];
    final List<MethodSignal> sellSignals = [];

    for (final MethodSignal signal in signals) {
      if (!signal.isTriggered) continue;
      if (_isBuyType(signal.alertType)) {
        buySignals.add(signal);
      } else if (_isSellType(signal.alertType)) {
        sellSignals.add(signal);
      }
    }

    final bool michoBuy = buySignals.any(
      (MethodSignal s) => s.alertType == AlertType.michoMethodBuy,
    );
    final bool michoSell = sellSignals.any(
      (MethodSignal s) => s.alertType == AlertType.michoMethodSell,
    );

    // Sum weighted contributions of non-Micho methods.
    double buyWeight = 0;
    for (final MethodSignal s in buySignals) {
      if (s.alertType != AlertType.michoMethodBuy) {
        buyWeight += config.weightFor(s.methodName);
      }
    }

    double sellWeight = 0;
    for (final MethodSignal s in sellSignals) {
      if (s.alertType != AlertType.michoMethodSell) {
        sellWeight += config.weightFor(s.methodName);
      }
    }

    final MethodSignal? consensusBuy =
        (michoBuy && buyWeight >= config.threshold)
        ? MethodSignal(
            ticker: ticker,
            methodName: 'Consensus',
            alertType: AlertType.consensusBuy,
            isTriggered: true,
            evaluatedAt: evaluatedAt,
            currentClose: buySignals.isNotEmpty
                ? buySignals.first.currentClose
                : null,
            description:
                'Weighted Consensus BUY: Micho + '
                'weight ${buyWeight.toStringAsFixed(2)} '
                '>= ${config.threshold}',
          )
        : null;

    final MethodSignal? consensusSell =
        (michoSell && sellWeight >= config.threshold)
        ? MethodSignal(
            ticker: ticker,
            methodName: 'Consensus',
            alertType: AlertType.consensusSell,
            isTriggered: true,
            evaluatedAt: evaluatedAt,
            currentClose: sellSignals.isNotEmpty
                ? sellSignals.first.currentClose
                : null,
            description:
                'Weighted Consensus SELL: Micho + '
                'weight ${sellWeight.toStringAsFixed(2)} '
                '>= ${config.threshold}',
          )
        : null;

    return WeightedConsensusResult(
      ticker: ticker,
      buySignal: consensusBuy,
      sellSignal: consensusSell,
      buyMethods: buySignals,
      sellMethods: sellSignals,
      buyWeightSum: buyWeight,
      sellWeightSum: sellWeight,
      threshold: config.threshold,
    );
  }

  static bool _isBuyType(AlertType type) {
    return type == AlertType.michoMethodBuy ||
        type == AlertType.rsiMethodBuy ||
        type == AlertType.macdMethodBuy ||
        type == AlertType.bollingerMethodBuy ||
        type == AlertType.stochasticMethodBuy ||
        type == AlertType.obvMethodBuy ||
        type == AlertType.adxMethodBuy ||
        type == AlertType.cciMethodBuy ||
        type == AlertType.sarMethodBuy ||
        type == AlertType.williamsRMethodBuy ||
        type == AlertType.mfiMethodBuy ||
        type == AlertType.supertrendMethodBuy;
  }

  static bool _isSellType(AlertType type) {
    return type == AlertType.michoMethodSell ||
        type == AlertType.rsiMethodSell ||
        type == AlertType.macdMethodSell ||
        type == AlertType.bollingerMethodSell ||
        type == AlertType.stochasticMethodSell ||
        type == AlertType.obvMethodSell ||
        type == AlertType.adxMethodSell ||
        type == AlertType.cciMethodSell ||
        type == AlertType.sarMethodSell ||
        type == AlertType.williamsRMethodSell ||
        type == AlertType.mfiMethodSell ||
        type == AlertType.supertrendMethodSell;
  }
}
