/// Data Freshness Tracker — pure domain value object.
///
/// Tracks the last-fetched timestamp for ticker candle data and provides
/// age calculations for staleness detection.
library;

import 'package:equatable/equatable.dart';

/// Freshness classification thresholds.
enum FreshnessLevel {
  /// Data updated within the last hour.
  fresh,

  /// Data updated within the last 24 hours.
  stale,

  /// Data older than 24 hours.
  expired;

  /// Human-readable label for UI display.
  String get label => switch (this) {
    FreshnessLevel.fresh => 'Fresh',
    FreshnessLevel.stale => 'Stale',
    FreshnessLevel.expired => 'Expired',
  };
}

/// Snapshot of data freshness for a single ticker.
class DataFreshness extends Equatable {
  const DataFreshness({
    required this.ticker,
    required this.lastUpdatedAt,
    required this.now,
    this.freshThreshold = const Duration(hours: 1),
    this.staleThreshold = const Duration(hours: 24),
  });

  /// The ticker symbol.
  final String ticker;

  /// When the candle data was last fetched/cached.
  final DateTime lastUpdatedAt;

  /// Current time (injected for testability).
  final DateTime now;

  /// Duration within which data is considered [FreshnessLevel.fresh].
  final Duration freshThreshold;

  /// Duration within which data is considered [FreshnessLevel.stale].
  /// Beyond this it is [FreshnessLevel.expired].
  final Duration staleThreshold;

  /// How long since the last update.
  Duration get age => now.difference(lastUpdatedAt);

  /// Classify the data freshness.
  FreshnessLevel get level {
    final Duration elapsed = age;
    if (elapsed <= freshThreshold) return FreshnessLevel.fresh;
    if (elapsed <= staleThreshold) return FreshnessLevel.stale;
    return FreshnessLevel.expired;
  }

  /// Human-readable age string: "3 min ago", "2 h ago", "1 d ago".
  String get ageLabel {
    final Duration elapsed = age;
    if (elapsed.inDays > 0) return '${elapsed.inDays} d ago';
    if (elapsed.inHours > 0) return '${elapsed.inHours} h ago';
    if (elapsed.inMinutes > 0) return '${elapsed.inMinutes} min ago';
    return 'just now';
  }

  @override
  List<Object?> get props => [
    ticker,
    lastUpdatedAt,
    now,
    freshThreshold,
    staleThreshold,
  ];
}
