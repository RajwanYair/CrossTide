/// Consensus Engine — Pure domain logic.
///
/// Combines the Micho Method (primary) with other trading method signals to
/// produce composite BUY / SELL recommendations.
///
/// **Consensus BUY (GREEN)**: Micho BUY is triggered AND at least one other
/// method also triggered a BUY signal on the same evaluation cycle.
///
/// **Consensus SELL (RED)**: Micho SELL is triggered AND at least one other
/// method also triggered a SELL signal on the same evaluation cycle.
///
/// The engine is method-agnostic. Callers provide a list of [MethodSignal]
/// results from whatever methods are active; the engine groups them by
/// direction and checks consensus rules.
library;

import 'entities.dart';
import 'micho_method_detector.dart';

/// Outcome of a consensus evaluation for one ticker.
class ConsensusResult {
  const ConsensusResult({
    required this.ticker,
    required this.buySignal,
    required this.sellSignal,
    required this.buyMethods,
    required this.sellMethods,
  });

  /// The ticker symbol.
  final String ticker;

  /// Non-null when consensus BUY is triggered.
  final MethodSignal? buySignal;

  /// Non-null when consensus SELL is triggered.
  final MethodSignal? sellSignal;

  /// All methods that triggered a BUY (including Micho if it triggered).
  final List<MethodSignal> buyMethods;

  /// All methods that triggered a SELL (including Micho if it triggered).
  final List<MethodSignal> sellMethods;

  /// `true` if at least one consensus signal (BUY or SELL) is triggered.
  bool get hasConsensus => buySignal != null || sellSignal != null;
}

class ConsensusEngine {
  const ConsensusEngine();

  /// Evaluate consensus from a flat list of method signals for a single ticker.
  ///
  /// [signals] should include Micho signals AND all other method signals.
  /// The engine does not invoke detectors — callers are responsible for
  /// running each detector first and gathering the results.
  ConsensusResult evaluate({
    required String ticker,
    required List<MethodSignal> signals,
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

    final int otherBuyCount = buySignals
        .where((MethodSignal s) => s.alertType != AlertType.michoMethodBuy)
        .length;
    final int otherSellCount = sellSignals
        .where((MethodSignal s) => s.alertType != AlertType.michoMethodSell)
        .length;

    final MethodSignal? consensusBuy = (michoBuy && otherBuyCount >= 1)
        ? MethodSignal(
            ticker: ticker,
            methodName: 'Consensus',
            alertType: AlertType.consensusBuy,
            isTriggered: true,
            evaluatedAt: DateTime.now(),
            currentClose: buySignals.first.currentClose,
            description:
                'Consensus BUY: Micho + '
                '$otherBuyCount other method(s) agree',
          )
        : null;

    final MethodSignal? consensusSell = (michoSell && otherSellCount >= 1)
        ? MethodSignal(
            ticker: ticker,
            methodName: 'Consensus',
            alertType: AlertType.consensusSell,
            isTriggered: true,
            evaluatedAt: DateTime.now(),
            currentClose: sellSignals.first.currentClose,
            description:
                'Consensus SELL: Micho + '
                '$otherSellCount other method(s) agree',
          )
        : null;

    return ConsensusResult(
      ticker: ticker,
      buySignal: consensusBuy,
      sellSignal: consensusSell,
      buyMethods: buySignals,
      sellMethods: sellSignals,
    );
  }

  static bool _isBuyType(AlertType type) {
    return type == AlertType.michoMethodBuy ||
        type == AlertType.rsiMethodBuy ||
        type == AlertType.macdMethodBuy ||
        type == AlertType.bollingerMethodBuy;
  }

  static bool _isSellType(AlertType type) {
    return type == AlertType.michoMethodSell ||
        type == AlertType.rsiMethodSell ||
        type == AlertType.macdMethodSell ||
        type == AlertType.bollingerMethodSell;
  }
}
