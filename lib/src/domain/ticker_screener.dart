/// Ticker Screener — filters a universe of tickers by multiple criteria.
///
/// Supports price range, SMA proximity, RSI zone, volume, and sector filters.
library;

import 'package:equatable/equatable.dart';

/// A single screening criterion.
class ScreenerCriterion extends Equatable {
  const ScreenerCriterion({
    required this.field,
    required this.op,
    required this.value,
  });

  /// Field name: 'close', 'rsi', 'smaDistance200', 'volume', 'sector'.
  final String field;

  /// Operator: 'gt', 'lt', 'gte', 'lte', 'eq', 'between', 'in'.
  final String op;

  /// Value(s): single number, comma-separated range, or list of strings.
  final String value;

  @override
  List<Object?> get props => [field, op, value];
}

/// A snapshot of a ticker's data for screening.
class ScreenerSnapshot extends Equatable {
  const ScreenerSnapshot({required this.ticker, required this.values});

  final String ticker;

  /// Named values: 'close', 'rsi', 'smaDistance200', 'volume', 'sector', etc.
  final Map<String, double> values;

  /// String tags (e.g. sector name).
  String tagFor(String field) => '';

  @override
  List<Object?> get props => [ticker, values];
}

/// Result of screening: matching tickers with their snapshots.
class ScreenerResult extends Equatable {
  const ScreenerResult({required this.matches, required this.totalScanned});

  final List<ScreenerSnapshot> matches;
  final int totalScanned;

  int get matchCount => matches.length;

  @override
  List<Object?> get props => [matches, totalScanned];
}

/// Filters ticker snapshots against a list of criteria.
class TickerScreener {
  const TickerScreener();

  /// Screen [snapshots] against all [criteria]. All criteria must pass (AND).
  ScreenerResult screen({
    required List<ScreenerSnapshot> snapshots,
    required List<ScreenerCriterion> criteria,
  }) {
    final matches = <ScreenerSnapshot>[];

    for (final ScreenerSnapshot snap in snapshots) {
      if (_passesAll(snap, criteria)) {
        matches.add(snap);
      }
    }

    return ScreenerResult(matches: matches, totalScanned: snapshots.length);
  }

  bool _passesAll(ScreenerSnapshot snap, List<ScreenerCriterion> criteria) {
    for (final ScreenerCriterion c in criteria) {
      if (!_passes(snap, c)) return false;
    }
    return true;
  }

  bool _passes(ScreenerSnapshot snap, ScreenerCriterion criterion) {
    final actual = snap.values[criterion.field];
    if (actual == null) return false;

    final parsed = double.tryParse(criterion.value);

    return switch (criterion.op) {
      'gt' => parsed != null && actual > parsed,
      'lt' => parsed != null && actual < parsed,
      'gte' => parsed != null && actual >= parsed,
      'lte' => parsed != null && actual <= parsed,
      'eq' => parsed != null && (actual - parsed).abs() < 1e-9,
      'between' => _between(actual, criterion.value),
      _ => false,
    };
  }

  bool _between(double actual, String value) {
    final parts = value.split(',');
    if (parts.length != 2) return false;
    final low = double.tryParse(parts[0].trim());
    final high = double.tryParse(parts[1].trim());
    if (low == null || high == null) return false;
    return actual >= low && actual <= high;
  }
}
