import 'package:equatable/equatable.dart';

/// Ticker watchlist stats — add/remove counts over a reporting window.
enum WatchlistStatsWindow { day, week, month, allTime }

class TickerWatchlistStats extends Equatable {
  const TickerWatchlistStats({
    required this.ticker,
    required this.watchlistCount,
    required this.addedCount,
    required this.removedCount,
    required this.window,
  });

  final String ticker;
  final int watchlistCount;
  final int addedCount;
  final int removedCount;
  final WatchlistStatsWindow window;

  TickerWatchlistStats copyWith({
    String? ticker,
    int? watchlistCount,
    int? addedCount,
    int? removedCount,
    WatchlistStatsWindow? window,
  }) => TickerWatchlistStats(
    ticker: ticker ?? this.ticker,
    watchlistCount: watchlistCount ?? this.watchlistCount,
    addedCount: addedCount ?? this.addedCount,
    removedCount: removedCount ?? this.removedCount,
    window: window ?? this.window,
  );

  @override
  List<Object?> get props => [
    ticker,
    watchlistCount,
    addedCount,
    removedCount,
    window,
  ];
}
