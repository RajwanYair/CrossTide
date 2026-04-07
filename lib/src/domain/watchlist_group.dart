/// Watchlist Group — pure domain value object.
///
/// Represents a named group of tickers in a user's watchlist.
/// Groups allow organizing tickers by theme (e.g., "Tech", "Dividends").
library;

import 'package:equatable/equatable.dart';

/// A named group of tickers.
class WatchlistGroup extends Equatable {
  const WatchlistGroup({
    required this.id,
    required this.name,
    this.tickers = const [],
    this.colorHex,
  });

  /// Unique group identifier.
  final String id;

  /// Human-readable group name.
  final String name;

  /// Ticker symbols in this group (ordered).
  final List<String> tickers;

  /// Optional hex color for UI display (e.g., '#FF5733').
  final String? colorHex;

  /// Number of tickers in this group.
  int get count => tickers.length;

  /// Whether this group is empty.
  bool get isEmpty => tickers.isEmpty;

  /// Whether this group is not empty.
  bool get isNotEmpty => tickers.isNotEmpty;

  /// Whether this group contains the given [ticker].
  bool contains(String ticker) =>
      tickers.any((String t) => t.toUpperCase() == ticker.toUpperCase());

  /// Return a copy with the given fields updated.
  WatchlistGroup copyWith({
    String? id,
    String? name,
    List<String>? tickers,
    String? Function()? colorHex,
  }) => WatchlistGroup(
    id: id ?? this.id,
    name: name ?? this.name,
    tickers: tickers ?? this.tickers,
    colorHex: colorHex != null ? colorHex() : this.colorHex,
  );

  /// Return a copy with [ticker] added (no duplicates, case-insensitive).
  WatchlistGroup addTicker(String ticker) {
    if (contains(ticker)) return this;
    return copyWith(tickers: [...tickers, ticker.toUpperCase()]);
  }

  /// Return a copy with [ticker] removed (case-insensitive).
  WatchlistGroup removeTicker(String ticker) {
    final String upper = ticker.toUpperCase();
    return copyWith(
      tickers: tickers.where((String t) => t.toUpperCase() != upper).toList(),
    );
  }

  /// Return a copy with tickers reordered: move [ticker] to [newIndex].
  WatchlistGroup reorderTicker(String ticker, int newIndex) {
    final List<String> reordered = List<String>.of(tickers);
    final int oldIndex = reordered.indexWhere(
      (String t) => t.toUpperCase() == ticker.toUpperCase(),
    );
    if (oldIndex < 0 || newIndex < 0 || newIndex >= reordered.length) {
      return this;
    }
    final String item = reordered.removeAt(oldIndex);
    reordered.insert(newIndex, item);
    return copyWith(tickers: reordered);
  }

  @override
  List<Object?> get props => [id, name, tickers, colorHex];
}
