/// Ticker Search Index — pure domain utility.
///
/// Provides fuzzy matching and scoring for ticker symbol search.
/// Matches against both symbol and company name.
library;

import 'package:equatable/equatable.dart';

/// An entry in the search index.
class TickerSearchEntry extends Equatable {
  const TickerSearchEntry({
    required this.symbol,
    required this.name,
    this.sector,
  });

  /// Ticker symbol (e.g., 'AAPL').
  final String symbol;

  /// Company name (e.g., 'Apple Inc.').
  final String name;

  /// Optional sector for filtering.
  final String? sector;

  @override
  List<Object?> get props => [symbol, name, sector];
}

/// A search result with relevance score.
class TickerSearchResult extends Equatable {
  const TickerSearchResult({required this.entry, required this.score});

  /// The matched entry.
  final TickerSearchEntry entry;

  /// Relevance score (higher = better match). Range: 0–100.
  final int score;

  @override
  List<Object?> get props => [entry, score];
}

/// Searches and ranks ticker entries by query relevance.
class TickerSearchIndex {
  const TickerSearchIndex();

  /// Search [entries] with the given [query].
  ///
  /// Returns results with score > 0, sorted by score descending.
  /// An empty query returns an empty list.
  List<TickerSearchResult> search(
    List<TickerSearchEntry> entries,
    String query,
  ) {
    final String q = query.trim().toUpperCase();
    if (q.isEmpty) return const [];

    final List<TickerSearchResult> results = [];
    for (final TickerSearchEntry entry in entries) {
      final int score = _score(entry, q);
      if (score > 0) {
        results.add(TickerSearchResult(entry: entry, score: score));
      }
    }
    results.sort(
      (TickerSearchResult a, TickerSearchResult b) =>
          b.score.compareTo(a.score),
    );
    return results;
  }

  int _score(TickerSearchEntry entry, String query) {
    final String symbol = entry.symbol.toUpperCase();
    final String name = entry.name.toUpperCase();

    // Exact symbol match.
    if (symbol == query) return 100;

    // Symbol starts with query.
    if (symbol.startsWith(query)) return 80;

    // Symbol contains query.
    if (symbol.contains(query)) return 60;

    // Name starts with query.
    if (name.startsWith(query)) return 50;

    // Name contains query as a word boundary.
    if (name.contains(' $query')) return 40;

    // Name contains query anywhere.
    if (name.contains(query)) return 30;

    // Substring match on individual query characters (basic fuzzy).
    if (_fuzzyMatch(symbol, query)) return 15;
    if (_fuzzyMatch(name, query)) return 10;

    return 0;
  }

  /// Basic subsequence fuzzy match: every character of [query]
  /// appears in [target] in order.
  bool _fuzzyMatch(String target, String query) {
    int qi = 0;
    for (int ti = 0; ti < target.length && qi < query.length; ti++) {
      if (target[ti] == query[qi]) qi++;
    }
    return qi == query.length;
  }
}
