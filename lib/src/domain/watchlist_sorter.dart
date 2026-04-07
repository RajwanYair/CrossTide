/// Watchlist Sorter — pure domain utility.
///
/// Sorts ticker entries by various criteria: alphabetical, distance
/// from SMA, sector, or custom order.
library;

import 'package:equatable/equatable.dart';

/// Criteria for sorting watchlist tickers.
enum SortCriteria {
  /// Alphabetical by ticker symbol.
  alphabetical,

  /// Distance from SMA200 (furthest above first).
  distanceFromSma200Desc,

  /// Distance from SMA200 (furthest below first).
  distanceFromSma200Asc,

  /// By sector name alphabetically.
  sector,

  /// By volume, highest first.
  volumeDesc,

  /// By daily % change, best first.
  dailyChangeDesc,

  /// By daily % change, worst first.
  dailyChangeAsc,
}

/// A ticker with the data needed for sorting.
class SortableTicker extends Equatable {
  const SortableTicker({
    required this.symbol,
    this.distanceFromSma200,
    this.sector,
    this.volume,
    this.dailyChangePct,
  });

  /// Ticker symbol.
  final String symbol;

  /// % distance from SMA200 (positive = above, negative = below).
  final double? distanceFromSma200;

  /// Sector name for sector-based sorting.
  final String? sector;

  /// Latest volume for volume-based sorting.
  final int? volume;

  /// Daily % change for performance-based sorting.
  final double? dailyChangePct;

  @override
  List<Object?> get props => [
    symbol,
    distanceFromSma200,
    sector,
    volume,
    dailyChangePct,
  ];
}

/// Sorts a list of [SortableTicker] by the given [SortCriteria].
class WatchlistSorter {
  const WatchlistSorter();

  /// Sort [tickers] by the given [criteria].
  ///
  /// Tickers with null values for the sort field are placed at the end.
  List<SortableTicker> sort(
    List<SortableTicker> tickers,
    SortCriteria criteria,
  ) {
    final List<SortableTicker> sorted = List<SortableTicker>.of(tickers);
    switch (criteria) {
      case SortCriteria.alphabetical:
        sorted.sort(
          (SortableTicker a, SortableTicker b) => a.symbol.compareTo(b.symbol),
        );
      case SortCriteria.distanceFromSma200Desc:
        sorted.sort(_compareDesc((SortableTicker t) => t.distanceFromSma200));
      case SortCriteria.distanceFromSma200Asc:
        sorted.sort(_compareAsc((SortableTicker t) => t.distanceFromSma200));
      case SortCriteria.sector:
        sorted.sort(
          (SortableTicker a, SortableTicker b) =>
              (a.sector ?? 'zzz').compareTo(b.sector ?? 'zzz'),
        );
      case SortCriteria.volumeDesc:
        sorted.sort(
          (SortableTicker a, SortableTicker b) => _nullLast(b.volume, a.volume),
        );
      case SortCriteria.dailyChangeDesc:
        sorted.sort(_compareDesc((SortableTicker t) => t.dailyChangePct));
      case SortCriteria.dailyChangeAsc:
        sorted.sort(_compareAsc((SortableTicker t) => t.dailyChangePct));
    }
    return sorted;
  }

  Comparator<SortableTicker> _compareDesc(
    double? Function(SortableTicker) extract,
  ) => (SortableTicker a, SortableTicker b) {
    final double? va = extract(a);
    final double? vb = extract(b);
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    return vb.compareTo(va);
  };

  Comparator<SortableTicker> _compareAsc(
    double? Function(SortableTicker) extract,
  ) => (SortableTicker a, SortableTicker b) {
    final double? va = extract(a);
    final double? vb = extract(b);
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    return va.compareTo(vb);
  };

  int _nullLast<T extends Comparable<T>>(T? a, T? b) {
    if (a == null && b == null) return 0;
    if (a == null) return 1;
    if (b == null) return -1;
    return a.compareTo(b);
  }
}
