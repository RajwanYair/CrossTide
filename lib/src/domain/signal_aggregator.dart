/// Signal Aggregator — pure domain logic.
///
/// Aggregates multiple [MethodSignal] results into a single-ticker
/// summary showing how many methods currently signal BUY, SELL, or
/// neutral, plus an overall bias.
library;

import 'package:equatable/equatable.dart';

import 'entities.dart';
import 'micho_method_detector.dart';

/// Aggregated signal summary for one ticker.
class SignalSummary extends Equatable {
  const SignalSummary({
    required this.ticker,
    required this.buyCount,
    required this.sellCount,
    required this.neutralCount,
    required this.totalMethods,
    required this.buyMethods,
    required this.sellMethods,
  });

  final String ticker;
  final int buyCount;
  final int sellCount;
  final int neutralCount;
  final int totalMethods;

  /// Names of methods currently signaling BUY.
  final List<String> buyMethods;

  /// Names of methods currently signaling SELL.
  final List<String> sellMethods;

  /// Overall bias: 'BUY', 'SELL', or 'NEUTRAL'.
  String get bias {
    if (buyCount > sellCount) return 'BUY';
    if (sellCount > buyCount) return 'SELL';
    return 'NEUTRAL';
  }

  /// Strength of the majority signal as a fraction (0.0–1.0).
  double get strength {
    if (totalMethods == 0) return 0;
    final int majority = buyCount > sellCount ? buyCount : sellCount;
    return majority / totalMethods;
  }

  @override
  List<Object?> get props => [
    ticker,
    buyCount,
    sellCount,
    neutralCount,
    totalMethods,
    buyMethods,
    sellMethods,
  ];
}

/// Aggregates [MethodSignal] objects into a [SignalSummary].
class SignalAggregator {
  const SignalAggregator();

  /// Classify alert types as BUY, SELL, or neutral.
  static bool _isBuy(AlertType type) {
    final String name = type.name.toLowerCase();
    return name.contains('buy') ||
        name.contains('crossup') ||
        name == 'goldencross';
  }

  static bool _isSell(AlertType type) {
    final String name = type.name.toLowerCase();
    return name.contains('sell') ||
        name.contains('crossdown') ||
        name == 'deathcross';
  }

  /// Aggregate signals for a single ticker.
  ///
  /// [signals] should be all current-evaluation signals for one ticker.
  SignalSummary aggregate({
    required String ticker,
    required List<MethodSignal> signals,
  }) {
    int buy = 0;
    int sell = 0;
    int neutral = 0;
    final List<String> buyNames = [];
    final List<String> sellNames = [];

    for (final MethodSignal signal in signals) {
      if (!signal.isTriggered) {
        neutral++;
        continue;
      }
      if (_isBuy(signal.alertType)) {
        buy++;
        buyNames.add(signal.methodName);
      } else if (_isSell(signal.alertType)) {
        sell++;
        sellNames.add(signal.methodName);
      } else {
        neutral++;
      }
    }

    return SignalSummary(
      ticker: ticker,
      buyCount: buy,
      sellCount: sell,
      neutralCount: neutral,
      totalMethods: signals.length,
      buyMethods: buyNames,
      sellMethods: sellNames,
    );
  }
}
