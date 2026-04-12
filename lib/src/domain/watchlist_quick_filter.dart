import 'package:equatable/equatable.dart';

/// A named quick-filter preset for the user's watchlist view.
class WatchlistQuickFilter extends Equatable {
  /// Creates a [WatchlistQuickFilter].
  const WatchlistQuickFilter({
    required this.filterId,
    required this.label,
    required this.minRsiThreshold,
    required this.maxRsiThreshold,
    required this.requireBuySignal,
    required this.requireSellSignal,
    this.sectorFilter,
  });

  /// Unique identifier.
  final String filterId;

  /// Display label shown on the filter chip.
  final String label;

  /// Minimum RSI threshold (0–100).
  final double minRsiThreshold;

  /// Maximum RSI threshold (0–100).
  final double maxRsiThreshold;

  /// Only show tickers with an active BUY signal.
  final bool requireBuySignal;

  /// Only show tickers with an active SELL signal.
  final bool requireSellSignal;

  /// Optional sector constraint.
  final String? sectorFilter;

  /// Returns `true` when the filter includes any signal requirement.
  bool get hasSignalFilter => requireBuySignal || requireSellSignal;

  /// Returns `true` when a sector constraint is applied.
  bool get hasSectorFilter => sectorFilter != null;

  /// RSI range width.
  double get rsiRange => maxRsiThreshold - minRsiThreshold;

  @override
  List<Object?> get props => [
    filterId,
    label,
    minRsiThreshold,
    maxRsiThreshold,
    requireBuySignal,
    requireSellSignal,
    sectorFilter,
  ];
}
