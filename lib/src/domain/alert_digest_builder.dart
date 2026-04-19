/// Alert Digest Builder — Pure domain logic.
///
/// Aggregates alert events from a time window into a structured daily or
/// weekly digest summary suitable for display or email delivery.
library;

import 'package:equatable/equatable.dart';

/// Frequency at which digests are generated.
enum DigestPeriod { daily, weekly }

/// A single alert event to be included in a digest.
class DigestAlertEvent extends Equatable {
  const DigestAlertEvent({
    required this.ticker,
    required this.alertType,
    required this.firedAt,
    this.closePrice,
    this.description,
  });

  final String ticker;
  final String alertType;
  final DateTime firedAt;
  final double? closePrice;
  final String? description;

  @override
  List<Object?> get props => [
    ticker,
    alertType,
    firedAt,
    closePrice,
    description,
  ];
}

/// Per-ticker summary within a digest.
class DigestTickerSummary extends Equatable {
  const DigestTickerSummary({
    required this.ticker,
    required this.alertCount,
    required this.alertTypes,
    required this.lastAlertAt,
    this.consensusDirection,
  });

  final String ticker;
  final int alertCount;
  final List<String> alertTypes;
  final DateTime lastAlertAt;

  /// Current consensus direction ('BUY', 'SELL', or null for neutral).
  final String? consensusDirection;

  @override
  List<Object?> get props => [
    ticker,
    alertCount,
    alertTypes,
    lastAlertAt,
    consensusDirection,
  ];
}

/// The complete digest output.
class AlertDigest extends Equatable {
  const AlertDigest({
    required this.period,
    required this.startDate,
    required this.endDate,
    required this.totalAlerts,
    required this.tickerSummaries,
    required this.topMovers,
  });

  final DigestPeriod period;
  final DateTime startDate;
  final DateTime endDate;
  final int totalAlerts;
  final List<DigestTickerSummary> tickerSummaries;

  /// Tickers with the most alerts, sorted descending.
  final List<String> topMovers;

  bool get isEmpty => totalAlerts == 0;

  @override
  List<Object?> get props => [
    period,
    startDate,
    endDate,
    totalAlerts,
    tickerSummaries,
    topMovers,
  ];
}

/// Builds an [AlertDigest] from raw alert events.
class AlertDigestBuilder {
  const AlertDigestBuilder();

  AlertDigest build({
    required List<DigestAlertEvent> events,
    required DigestPeriod period,
    required DateTime windowStart,
    required DateTime windowEnd,
  }) {
    // Filter events within the window.
    final List<DigestAlertEvent> inWindow = events
        .where(
          (DigestAlertEvent e) =>
              !e.firedAt.isBefore(windowStart) && !e.firedAt.isAfter(windowEnd),
        )
        .toList();

    // Group by ticker.
    final Map<String, List<DigestAlertEvent>> byTicker = {};
    for (final DigestAlertEvent e in inWindow) {
      byTicker.putIfAbsent(e.ticker, () => []).add(e);
    }

    // Build per-ticker summaries, sorted by alert count descending.
    final List<DigestTickerSummary> summaries = [];
    for (final MapEntry<String, List<DigestAlertEvent>> entry
        in byTicker.entries) {
      final List<DigestAlertEvent> tickerEvents = entry.value;
      final Set<String> types = tickerEvents
          .map((DigestAlertEvent e) => e.alertType)
          .toSet();

      DateTime latest = tickerEvents.first.firedAt;
      for (final DigestAlertEvent e in tickerEvents) {
        if (e.firedAt.isAfter(latest)) latest = e.firedAt;
      }

      summaries.add(
        DigestTickerSummary(
          ticker: entry.key,
          alertCount: tickerEvents.length,
          alertTypes: types.toList()..sort(),
          lastAlertAt: latest,
        ),
      );
    }

    summaries.sort(
      (DigestTickerSummary a, DigestTickerSummary b) =>
          b.alertCount.compareTo(a.alertCount),
    );

    final List<String> topMovers = summaries
        .take(5)
        .map((DigestTickerSummary s) => s.ticker)
        .toList();

    return AlertDigest(
      period: period,
      startDate: windowStart,
      endDate: windowEnd,
      totalAlerts: inWindow.length,
      tickerSummaries: summaries,
      topMovers: topMovers,
    );
  }
}
