/// Price Level Notifier — detects when price crosses significant levels
/// (round numbers, previous highs/lows, custom levels) for alerting.
library;

import 'package:equatable/equatable.dart';

/// Type of price level.
enum PriceLevelType { roundNumber, previousHigh, previousLow, custom }

/// A significant price level.
class PriceLevel extends Equatable {
  const PriceLevel({
    required this.type,
    required this.price,
    required this.label,
  });

  final PriceLevelType type;
  final double price;
  final String label;

  @override
  List<Object?> get props => [type, price, label];
}

/// A price level crossing event.
class PriceLevelCrossing extends Equatable {
  const PriceLevelCrossing({
    required this.ticker,
    required this.level,
    required this.crossedAbove,
    required this.currentPrice,
  });

  final String ticker;
  final PriceLevel level;

  /// True if price crossed above the level, false if below.
  final bool crossedAbove;

  final double currentPrice;

  @override
  List<Object?> get props => [ticker, level, crossedAbove, currentPrice];
}

/// Detects price level crossings.
class PriceLevelNotifier {
  const PriceLevelNotifier();

  /// Detect crossings of round number levels.
  List<PriceLevelCrossing> detectRoundNumbers({
    required String ticker,
    required double previousClose,
    required double currentClose,
    double increment = 10.0,
  }) {
    final crossings = <PriceLevelCrossing>[];
    final lower = previousClose < currentClose ? previousClose : currentClose;
    final upper = previousClose < currentClose ? currentClose : previousClose;

    // Find round numbers between lower and upper
    var level = (lower / increment).ceil() * increment;
    while (level <= upper) {
      if (level > lower) {
        final crossedAbove = currentClose > previousClose;
        crossings.add(
          PriceLevelCrossing(
            ticker: ticker,
            level: PriceLevel(
              type: PriceLevelType.roundNumber,
              price: level.toDouble(),
              label: '\$${level.toStringAsFixed(0)}',
            ),
            crossedAbove: crossedAbove,
            currentPrice: currentClose,
          ),
        );
      }
      level += increment;
    }

    return crossings;
  }

  /// Detect crossings of custom price levels.
  List<PriceLevelCrossing> detectCustomLevels({
    required String ticker,
    required double previousClose,
    required double currentClose,
    required List<PriceLevel> levels,
  }) {
    final crossings = <PriceLevelCrossing>[];

    for (final PriceLevel lvl in levels) {
      final wasBelowOrAt = previousClose <= lvl.price;
      final isAbove = currentClose > lvl.price;
      final wasAboveOrAt = previousClose >= lvl.price;
      final isBelow = currentClose < lvl.price;

      if (wasBelowOrAt && isAbove) {
        crossings.add(
          PriceLevelCrossing(
            ticker: ticker,
            level: lvl,
            crossedAbove: true,
            currentPrice: currentClose,
          ),
        );
      } else if (wasAboveOrAt && isBelow) {
        crossings.add(
          PriceLevelCrossing(
            ticker: ticker,
            level: lvl,
            crossedAbove: false,
            currentPrice: currentClose,
          ),
        );
      }
    }

    return crossings;
  }
}
