import 'package:equatable/equatable.dart';

/// Status of a single batch scan job.
enum BatchScanStatus {
  /// Job is queued but not yet started.
  queued,

  /// Job is actively running.
  running,

  /// Job completed successfully.
  completed,

  /// Job failed due to an error.
  failed,

  /// Job was cancelled before completion.
  cancelled,
}

/// A single batch market-scan job record.
///
/// Tracks progress, timing, and results for a bulk scan across multiple
/// tickers or screening configurations.
class BatchScanJob extends Equatable {
  /// Creates a [BatchScanJob].
  const BatchScanJob({
    required this.jobId,
    required this.status,
    required this.totalTickers,
    required this.processedTickers,
    required this.matchedTickers,
    required this.createdAt,
    this.completedAt,
    this.errorMessage,
  });

  /// Unique identifier for this scan job.
  final String jobId;

  /// Current status of the job.
  final BatchScanStatus status;

  /// Total number of tickers to scan.
  final int totalTickers;

  /// Number of tickers processed so far.
  final int processedTickers;

  /// Number of tickers that matched the scan criteria.
  final int matchedTickers;

  /// Timestamp when the job was created.
  final DateTime createdAt;

  /// Timestamp when the job finished (`null` while running or queued).
  final DateTime? completedAt;

  /// Error message if the job failed (`null` otherwise).
  final String? errorMessage;

  /// Progress percentage [0.0–100.0].
  double get progressPct =>
      totalTickers == 0 ? 0.0 : processedTickers / totalTickers * 100;

  /// Returns `true` when the job has finished successfully.
  bool get isComplete => status == BatchScanStatus.completed;

  /// Returns `true` when the job is still in progress.
  bool get isRunning => status == BatchScanStatus.running;

  @override
  List<Object?> get props => [
    jobId,
    status,
    totalTickers,
    processedTickers,
    matchedTickers,
    createdAt,
    completedAt,
    errorMessage,
  ];
}
