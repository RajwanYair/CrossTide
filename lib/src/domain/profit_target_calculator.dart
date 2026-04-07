/// Profit Target Calculator — computes take-profit levels using
/// fixed percentages, risk:reward ratio, or Fibonacci extensions.
library;

import 'package:equatable/equatable.dart';

/// A named profit target level.
class ProfitTarget extends Equatable {
  const ProfitTarget({
    required this.label,
    required this.price,
    required this.returnPct,
  });

  final String label;
  final double price;

  /// Expected return percentage from entry price.
  final double returnPct;

  @override
  List<Object?> get props => [label, price, returnPct];
}

/// Result of profit target calculation.
class ProfitTargetResult extends Equatable {
  const ProfitTargetResult({required this.entryPrice, required this.targets});

  final double entryPrice;
  final List<ProfitTarget> targets;

  @override
  List<Object?> get props => [entryPrice, targets];
}

/// Computes take-profit levels.
class ProfitTargetCalculator {
  const ProfitTargetCalculator();

  /// Fixed-percentage targets (e.g. 5%, 10%, 15%).
  ProfitTargetResult fixedPercentage({
    required double entryPrice,
    required List<double> targetPcts,
  }) {
    final targets = <ProfitTarget>[
      for (final double pct in targetPcts)
        ProfitTarget(
          label: '${pct.toStringAsFixed(1)}%',
          price: entryPrice * (1 + pct / 100),
          returnPct: pct,
        ),
    ];
    return ProfitTargetResult(entryPrice: entryPrice, targets: targets);
  }

  /// Risk:reward targets.
  ///
  /// [stopLoss] is the stop-loss price below entry.
  /// [ratios] are the R:R ratios (e.g. 1.0, 2.0, 3.0).
  ProfitTargetResult riskReward({
    required double entryPrice,
    required double stopLoss,
    required List<double> ratios,
  }) {
    final risk = entryPrice - stopLoss;
    if (risk <= 0) {
      return ProfitTargetResult(entryPrice: entryPrice, targets: const []);
    }

    final targets = <ProfitTarget>[
      for (final double ratio in ratios)
        ProfitTarget(
          label: '${ratio.toStringAsFixed(1)}R',
          price: entryPrice + (risk * ratio),
          returnPct: (risk * ratio / entryPrice) * 100,
        ),
    ];
    return ProfitTargetResult(entryPrice: entryPrice, targets: targets);
  }

  /// Fibonacci extension targets (1.0, 1.272, 1.618, 2.0, 2.618).
  ProfitTargetResult fibonacciExtension({
    required double swingLow,
    required double swingHigh,
  }) {
    final range = swingHigh - swingLow;
    if (range <= 0) {
      return ProfitTargetResult(entryPrice: swingHigh, targets: const []);
    }

    const levels = [1.0, 1.272, 1.618, 2.0, 2.618];
    final targets = <ProfitTarget>[
      for (final double level in levels)
        ProfitTarget(
          label: 'Fib ${level.toStringAsFixed(3)}',
          price: swingLow + range * level,
          returnPct: ((range * level) / swingHigh) * 100,
        ),
    ];
    return ProfitTargetResult(entryPrice: swingHigh, targets: targets);
  }
}
