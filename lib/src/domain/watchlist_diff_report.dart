import 'package:equatable/equatable.dart';

/// The nature of a change between two watchlist snapshots.
enum WatchlistChangeType {
  /// Ticker was added in the newer snapshot.
  added,

  /// Ticker was removed in the newer snapshot.
  removed,

  /// Ticker price increased between snapshots.
  priceIncreased,

  /// Ticker price decreased between snapshots.
  priceDecreased,

  /// Ticker is unchanged.
  unchanged,
}

/// A single change entry in a watchlist diff.
class WatchlistChangeEntry extends Equatable {
  const WatchlistChangeEntry({
    required this.ticker,
    required this.changeType,
    this.previousPrice,
    this.currentPrice,
  });

  final String ticker;
  final WatchlistChangeType changeType;

  /// Previous close price. Null for [WatchlistChangeType.added].
  final double? previousPrice;

  /// Current close price. Null for [WatchlistChangeType.removed].
  final double? currentPrice;

  /// Absolute price delta (positive = increase, negative = decrease).
  double? get priceDelta => (previousPrice != null && currentPrice != null)
      ? currentPrice! - previousPrice!
      : null;

  /// Percentage price change relative to previous price.
  double? get priceDeltaPct =>
      (previousPrice != null && previousPrice! != 0 && currentPrice != null)
      ? (currentPrice! - previousPrice!) / previousPrice! * 100
      : null;

  @override
  List<Object?> get props => [ticker, changeType, previousPrice, currentPrice];
}

/// Diff report comparing two watchlist snapshots in time.
class WatchlistDiffReport extends Equatable {
  const WatchlistDiffReport({
    required this.snapshotIdBefore,
    required this.snapshotIdAfter,
    required this.changes,
  });

  final String snapshotIdBefore;
  final String snapshotIdAfter;
  final List<WatchlistChangeEntry> changes;

  /// All tickers added in the newer snapshot.
  List<String> get addedTickers => changes
      .where(
        (WatchlistChangeEntry e) => e.changeType == WatchlistChangeType.added,
      )
      .map((WatchlistChangeEntry e) => e.ticker)
      .toList();

  /// All tickers removed in the newer snapshot.
  List<String> get removedTickers => changes
      .where(
        (WatchlistChangeEntry e) => e.changeType == WatchlistChangeType.removed,
      )
      .map((WatchlistChangeEntry e) => e.ticker)
      .toList();

  /// Changes where price moved (either direction).
  List<WatchlistChangeEntry> get priceChanges => changes
      .where(
        (WatchlistChangeEntry e) =>
            e.changeType == WatchlistChangeType.priceIncreased ||
            e.changeType == WatchlistChangeType.priceDecreased,
      )
      .toList();

  /// True when there are any additions or removals.
  bool get hasStructuralChanges =>
      addedTickers.isNotEmpty || removedTickers.isNotEmpty;

  @override
  List<Object?> get props => [snapshotIdBefore, snapshotIdAfter, changes];
}
