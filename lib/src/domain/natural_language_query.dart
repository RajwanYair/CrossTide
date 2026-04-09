/// Natural Language Query — models a parsed natural-language ticker search.
library;

import 'package:equatable/equatable.dart';

/// High-level intent inferred from the user's natural language query.
enum NlQueryIntent {
  /// "Show me tickers below their 200-day moving average."
  findTickersBelowSma,

  /// "Show me tickers above their 50-day moving average."
  findTickersAboveSma,

  /// "Find high momentum stocks."
  findHighMomentum,

  /// "Find oversold tickers."
  findOversold,

  /// "Find overbought tickers."
  findOverbought,

  /// "Show tech sector stocks in my watchlist."
  findSectorTickers,

  /// "Which tickers are close to a cross-up?"
  findCrossUpCandidates,

  /// "Summarise my watchlist."
  summarizeWatchlist,

  /// Could not determine intent.
  unknown,
}

/// Which SMA the query is referencing.
enum SmaReference {
  /// 50-day simple moving average.
  sma50,

  /// 150-day simple moving average.
  sma150,

  /// 200-day simple moving average.
  sma200,
}

/// A single parsed constraint extracted from the query
/// (e.g. `rsi < 30`, `price > 150`).
class NlQueryConstraint extends Equatable {
  const NlQueryConstraint({
    required this.field,
    required this.operator,
    required this.value,
  });

  /// Field name (e.g. 'rsi', 'price', 'volume', 'sector').
  final String field;

  /// Comparison operator as a string: 'lt', 'gt', 'eq', 'near'.
  final String operator;

  /// Value to compare against (as a string; caller parses to numeric if needed).
  final String value;

  @override
  List<Object?> get props => [field, operator, value];
}

/// Result of parsing a raw natural-language watchlist query.
class NaturalLanguageQuery extends Equatable {
  const NaturalLanguageQuery({
    required this.raw,
    required this.intent,
    required this.constraints,
    required this.parsedAt,
    this.smaReference,
    this.sectorHint,
  });

  /// The verbatim user query string.
  final String raw;

  /// The parsed intent category.
  final NlQueryIntent intent;

  /// Structural constraints extracted from the query.
  final List<NlQueryConstraint> constraints;

  final DateTime parsedAt;

  /// Which SMA period the query refers to, if any.
  final SmaReference? smaReference;

  /// Sector keyword hint (e.g. 'tech', 'energy'), if mentioned.
  final String? sectorHint;

  /// Returns true when [intent] is not [NlQueryIntent.unknown].
  bool get isParsed => intent != NlQueryIntent.unknown;

  @override
  List<Object?> get props => [
    raw,
    intent,
    constraints,
    parsedAt,
    smaReference,
    sectorHint,
  ];
}
