/// Cross-Up Anomaly Detector — pure domain logic.
///
/// Flags tickers whose alert history shows repeated cross-up events within a
/// short time window. This is a signal that the underlying data is noisy or the
/// alert threshold is too sensitive.
library;

import 'entities.dart';

/// An anomaly detected when the same ticker fires multiple cross-up alerts
/// within [windowHours] hours.
class CrossUpAnomaly {
  const CrossUpAnomaly({
    required this.symbol,
    required this.occurrences,
    required this.windowHours,
    required this.firstFiredAt,
    required this.lastFiredAt,
  });

  /// Ticker that exhibited the anomaly.
  final String symbol;

  /// Number of cross-up events in the window.
  final int occurrences;

  /// The sliding window used for this detection (hours).
  final int windowHours;

  /// Earliest alert timestamp within the flagged window.
  final DateTime firstFiredAt;

  /// Latest alert timestamp within the flagged window.
  final DateTime lastFiredAt;

  @override
  String toString() =>
      'CrossUpAnomaly($symbol, $occurrences × in ${windowHours}h, '
      'first=$firstFiredAt, last=$lastFiredAt)';
}

/// Detects tickers that have fired the same type of cross-up alert multiple
/// times within a configurable sliding window.
class CrossUpAnomalyDetector {
  const CrossUpAnomalyDetector({
    this.windowHours = 24,
    this.minOccurrences = 2,
  });

  /// Sliding window length in hours. Default 24 hours.
  final int windowHours;

  /// Minimum number of cross-up events within [windowHours] to constitute an
  /// anomaly. Must be ≥ 2.
  final int minOccurrences;

  /// Scan [history] and return every ticker/alert-type pair that has fired
  /// [minOccurrences] or more times within [windowHours] hours.
  ///
  /// Only SMA/Golden/Death-cross alert types are considered — price-target and
  /// volume spikes are intentionally excluded because they can legitimately
  /// fire multiple times.
  List<CrossUpAnomaly> detect(List<AlertHistoryEntry> history) {
    final smaAlertTypes = {
      'sma200CrossUp',
      'sma150CrossUp',
      'sma50CrossUp',
      'goldenCross',
      'deathCross',
    };

    // Group by symbol + alertType
    final Map<String, List<DateTime>> buckets = {};
    for (final entry in history) {
      if (!smaAlertTypes.contains(entry.alertType)) continue;
      final key = '${entry.symbol}::${entry.alertType}';
      buckets.putIfAbsent(key, () => []).add(entry.firedAt);
    }

    final anomalies = <CrossUpAnomaly>[];
    final window = Duration(hours: windowHours);

    for (final entry in buckets.entries) {
      final times = List<DateTime>.from(entry.value)
        ..sort((a, b) => a.compareTo(b));

      // Sliding window: for each time[i] find how many fall within window.
      int i = 0;
      while (i < times.length) {
        int j = i + 1;
        while (j < times.length && times[j].difference(times[i]) <= window) {
          j++;
        }
        final count = j - i;
        if (count >= minOccurrences) {
          final parts = entry.key.split('::');
          anomalies.add(
            CrossUpAnomaly(
              symbol: parts[0],
              occurrences: count,
              windowHours: windowHours,
              firstFiredAt: times[i],
              lastFiredAt: times[j - 1],
            ),
          );
          // Advance past this window to avoid double-counting (greedy)
          i = j;
        } else {
          i++;
        }
      }
    }

    return anomalies;
  }
}
