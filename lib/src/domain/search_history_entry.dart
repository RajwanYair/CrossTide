import 'package:equatable/equatable.dart';

/// A single entry in the user's recent ticker/symbol search history.
class SearchHistoryEntry extends Equatable {
  /// Creates a [SearchHistoryEntry].
  const SearchHistoryEntry({
    required this.entryId,
    required this.query,
    required this.searchedAt,
    required this.resultCount,
    this.selectedTicker,
  });

  /// Unique identifier.
  final String entryId;

  /// The raw search query string.
  final String query;

  /// When the search was performed.
  final DateTime searchedAt;

  /// Number of results returned.
  final int resultCount;

  /// Ticker the user tapped after the search (null if they navigated away).
  final String? selectedTicker;

  /// Returns `true` when the user selected a result.
  bool get hasSelection => selectedTicker != null;

  /// Returns `true` when the search yielded at least one result.
  bool get hasResults => resultCount > 0;

  @override
  List<Object?> get props => [
    entryId,
    query,
    searchedAt,
    resultCount,
    selectedTicker,
  ];
}
