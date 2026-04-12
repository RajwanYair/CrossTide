import 'package:equatable/equatable.dart';

/// Overall health status of a watchlist.
enum WatchlistHealthStatus { healthy, needsAttention, stale, incomplete }

/// A health-check snapshot for a watchlist, covering data freshness,
/// symbol validity, and alert coverage.
class WatchlistHealthCheck extends Equatable {
  const WatchlistHealthCheck({
    required this.watchlistId,
    required this.status,
    required this.totalTickers,
    required this.staleTickerCount,
    required this.invalidTickerCount,
    required this.uncoveredByAlerts,
    required this.checkedAt,
    this.staleTickerSymbols = const [],
  });

  final String watchlistId;
  final WatchlistHealthStatus status;
  final int totalTickers;

  /// Tickers whose market data has not been refreshed within policy limits.
  final int staleTickerCount;

  /// Tickers that returned a 404 / delisted from the provider.
  final int invalidTickerCount;

  /// Tickers with no alert configured.
  final int uncoveredByAlerts;

  final DateTime checkedAt;
  final List<String> staleTickerSymbols;

  WatchlistHealthCheck copyWith({
    String? watchlistId,
    WatchlistHealthStatus? status,
    int? totalTickers,
    int? staleTickerCount,
    int? invalidTickerCount,
    int? uncoveredByAlerts,
    DateTime? checkedAt,
    List<String>? staleTickerSymbols,
  }) => WatchlistHealthCheck(
    watchlistId: watchlistId ?? this.watchlistId,
    status: status ?? this.status,
    totalTickers: totalTickers ?? this.totalTickers,
    staleTickerCount: staleTickerCount ?? this.staleTickerCount,
    invalidTickerCount: invalidTickerCount ?? this.invalidTickerCount,
    uncoveredByAlerts: uncoveredByAlerts ?? this.uncoveredByAlerts,
    checkedAt: checkedAt ?? this.checkedAt,
    staleTickerSymbols: staleTickerSymbols ?? this.staleTickerSymbols,
  );

  @override
  List<Object?> get props => [
    watchlistId,
    status,
    totalTickers,
    staleTickerCount,
    invalidTickerCount,
    uncoveredByAlerts,
    checkedAt,
    staleTickerSymbols,
  ];
}
