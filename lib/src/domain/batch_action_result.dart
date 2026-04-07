/// Batch Action Result — pure domain value object.
///
/// Tracks the outcome of applying a batch action to multiple tickers.
library;

import 'package:equatable/equatable.dart';

/// Outcome of a single ticker in a batch operation.
enum BatchItemStatus {
  /// Operation succeeded.
  success,

  /// Operation failed.
  failure,

  /// Operation was skipped (e.g., ticker already in desired state).
  skipped,
}

/// Result for a single ticker in a batch.
class BatchItemResult extends Equatable {
  const BatchItemResult({
    required this.ticker,
    required this.status,
    this.message,
  });

  /// The ticker symbol.
  final String ticker;

  /// The outcome of the operation.
  final BatchItemStatus status;

  /// Optional message (e.g., failure reason).
  final String? message;

  @override
  List<Object?> get props => [ticker, status, message];
}

/// Aggregate result of a batch action across multiple tickers.
class BatchActionResult extends Equatable {
  const BatchActionResult({required this.action, required this.results});

  /// Description of the batch action (e.g., "Apply Aggressive profile").
  final String action;

  /// Per-ticker results.
  final List<BatchItemResult> results;

  /// Number of successful operations.
  int get successCount => results
      .where((BatchItemResult r) => r.status == BatchItemStatus.success)
      .length;

  /// Number of failed operations.
  int get failureCount => results
      .where((BatchItemResult r) => r.status == BatchItemStatus.failure)
      .length;

  /// Number of skipped operations.
  int get skippedCount => results
      .where((BatchItemResult r) => r.status == BatchItemStatus.skipped)
      .length;

  /// Total number of tickers processed.
  int get total => results.length;

  /// Whether all operations succeeded.
  bool get allSucceeded => failureCount == 0;

  @override
  List<Object?> get props => [action, results];
}
