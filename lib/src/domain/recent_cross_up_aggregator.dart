/// Recent CrossUp Aggregator — pure domain utility.
///
/// Aggregates cross-up events from alert history into time-bucketed
/// summaries for the dashboard.
library;

import 'package:equatable/equatable.dart';

import 'entities.dart';

/// A time-bucketed count of cross-up events.
class CrossUpBucket extends Equatable {
  const CrossUpBucket({
    required this.label,
    required this.count,
    required this.tickers,
  });

  /// Human-readable label for this bucket (e.g., "Today", "This Week").
  final String label;

  /// Number of cross-up events in this bucket.
  final int count;

  /// Unique ticker symbols that had cross-ups in this bucket.
  final List<String> tickers;

  @override
  List<Object?> get props => [label, count, tickers];
}

/// Aggregates [AlertHistoryEntry] items into time buckets.
class RecentCrossUpAggregator {
  const RecentCrossUpAggregator();

  /// Bucket alert history entries by recency relative to [asOf].
  ///
  /// Returns buckets: Today, This Week (7 days), This Month (30 days).
  /// Only entries with cross-up alert types are counted.
  List<CrossUpBucket> aggregate(
    List<AlertHistoryEntry> history, {
    required DateTime asOf,
  }) {
    final List<AlertHistoryEntry> crossUps = history
        .where((AlertHistoryEntry h) => _isCrossUpType(h.alertType))
        .toList();

    final DateTime todayStart = DateTime(asOf.year, asOf.month, asOf.day);
    final DateTime weekStart = todayStart.subtract(const Duration(days: 7));
    final DateTime monthStart = todayStart.subtract(const Duration(days: 30));

    return [
      _bucket(
        'Today',
        crossUps
            .where((AlertHistoryEntry h) => !h.firedAt.isBefore(todayStart))
            .toList(),
      ),
      _bucket(
        'This Week',
        crossUps
            .where((AlertHistoryEntry h) => !h.firedAt.isBefore(weekStart))
            .toList(),
      ),
      _bucket(
        'This Month',
        crossUps
            .where((AlertHistoryEntry h) => !h.firedAt.isBefore(monthStart))
            .toList(),
      ),
    ];
  }

  CrossUpBucket _bucket(String label, List<AlertHistoryEntry> entries) {
    final Set<String> tickers = {
      for (final AlertHistoryEntry e in entries) e.symbol,
    };
    return CrossUpBucket(
      label: label,
      count: entries.length,
      tickers: tickers.toList()..sort(),
    );
  }

  static const Set<String> _crossUpTypes = {
    'sma200CrossUp',
    'sma150CrossUp',
    'sma50CrossUp',
    'goldenCross',
  };

  bool _isCrossUpType(String alertType) => _crossUpTypes.contains(alertType);
}
