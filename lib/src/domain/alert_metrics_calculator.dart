/// Alert metrics — per-ticker frequency statistics derived from alert history.
///
/// Pure domain logic; no Flutter or external dependencies.
library;

import 'package:equatable/equatable.dart';

import 'entities.dart';

/// Per-ticker alert-frequency statistics.
class AlertMetrics extends Equatable {
  const AlertMetrics({
    required this.symbol,
    required this.alertCount,
    this.firstAlertAt,
    this.lastAlertAt,
    this.meanDaysBetweenAlerts,
  });

  final String symbol;
  final int alertCount;
  final DateTime? firstAlertAt;
  final DateTime? lastAlertAt;

  /// Mean calendar days between consecutive alerts.
  /// `null` when [alertCount] < 2 (no interval to measure).
  final double? meanDaysBetweenAlerts;

  @override
  List<Object?> get props => [
    symbol,
    alertCount,
    firstAlertAt,
    lastAlertAt,
    meanDaysBetweenAlerts,
  ];
}

/// Computes [AlertMetrics] from a flat list of [AlertHistoryEntry] records.
///
/// Input list need not be sorted — the calculator sorts internally per symbol.
class AlertMetricsCalculator {
  const AlertMetricsCalculator();

  /// Returns one [AlertMetrics] per symbol, sorted by [alertCount] descending,
  /// then by [symbol] alphabetically.
  List<AlertMetrics> compute(List<AlertHistoryEntry> history) {
    if (history.isEmpty) return [];

    final Map<String, List<AlertHistoryEntry>> bySymbol = {};
    for (final AlertHistoryEntry entry in history) {
      (bySymbol[entry.symbol] ??= []).add(entry);
    }

    final List<AlertMetrics> results = [];
    for (final MapEntry<String, List<AlertHistoryEntry>> pair
        in bySymbol.entries) {
      final List<AlertHistoryEntry> sorted = [...pair.value]
        ..sort((a, b) => a.firedAt.compareTo(b.firedAt));

      double? mean;
      if (sorted.length >= 2) {
        double totalDays = 0;
        for (int i = 1; i < sorted.length; i++) {
          totalDays +=
              sorted[i].firedAt.difference(sorted[i - 1].firedAt).inSeconds /
              86400.0;
        }
        mean = totalDays / (sorted.length - 1);
      }

      results.add(
        AlertMetrics(
          symbol: pair.key,
          alertCount: sorted.length,
          firstAlertAt: sorted.first.firedAt,
          lastAlertAt: sorted.last.firedAt,
          meanDaysBetweenAlerts: mean,
        ),
      );
    }

    results.sort((a, b) {
      final int cmp = b.alertCount.compareTo(a.alertCount);
      return cmp != 0 ? cmp : a.symbol.compareTo(b.symbol);
    });
    return results;
  }
}
