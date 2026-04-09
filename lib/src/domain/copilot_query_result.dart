/// Copilot Query Result — response from an AI/Copilot assistant query about the watchlist.
library;

import 'package:equatable/equatable.dart';

/// The parsed intent of a natural-language watchlist query.
enum QueryIntent {
  /// Looking up a specific ticker.
  tickerLookup,

  /// Asking why a signal fired.
  signalExplanation,

  /// Requesting historical data backfill.
  backfillRequest,

  /// Asking for a sector-level summary.
  sectorSummary,

  /// Asking for a portfolio risk assessment.
  riskAssessment,

  /// Intent could not be determined.
  unknown,
}

/// A source reference cited in the AI response.
class QueryCitation extends Equatable {
  const QueryCitation({
    required this.source,
    required this.excerpt,
    this.ticker,
    this.date,
  });

  /// Human-readable source name (e.g. "Yahoo Finance", "EDGAR").
  final String source;

  /// Short excerpt supporting the answer.
  final String excerpt;

  /// Ticker symbol this citation relates to, if applicable.
  final String? ticker;

  /// Date of the cited material, if known.
  final DateTime? date;

  @override
  List<Object?> get props => [source, excerpt, ticker, date];
}

/// Full response from an AI assistant query, including answer, citations, and confidence.
class CopilotQueryResult extends Equatable {
  const CopilotQueryResult({
    required this.query,
    required this.intent,
    required this.answer,
    required this.citations,
    required this.confidence,
    required this.respondedAt,
  }) : assert(
         confidence >= 0.0 && confidence <= 1.0,
         'confidence must be in [0.0, 1.0]',
       );

  /// The original user query string.
  final String query;

  final QueryIntent intent;

  /// The AI-generated answer text.
  final String answer;

  final List<QueryCitation> citations;

  /// Model confidence in the answer: 0.0 (lowest) to 1.0 (highest).
  final double confidence;

  final DateTime respondedAt;

  /// Returns true when confidence is ≥ 0.8.
  bool get isHighConfidence => confidence >= 0.8;

  @override
  List<Object?> get props => [
    query,
    intent,
    answer,
    citations,
    confidence,
    respondedAt,
  ];
}
