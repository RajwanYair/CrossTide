/// Performance Monitor Service — application-layer orchestration.
///
/// Uses [PerformanceScorer] to track and score operation latencies.
library;

import '../domain/domain.dart';

/// Orchestrates performance monitoring and scoring.
class PerformanceMonitorService {
  /// Create with injectable scorer.
  PerformanceMonitorService({
    PerformanceScorer scorer = const PerformanceScorer(),
  }) : _scorer = scorer;

  final PerformanceScorer _scorer;
  final List<PerformanceSample> _samples = [];

  /// Record a performance sample.
  void record(PerformanceSample sample) {
    _samples.add(sample);
  }

  /// Record a named operation with its duration in milliseconds.
  void recordOperation(String operation, int durationMs) {
    _samples.add(
      PerformanceSample(
        operation: operation,
        durationMs: durationMs,
        timestamp: DateTime.now(),
      ),
    );
  }

  /// Return the current performance score.  Returns `null` when no
  /// samples have been recorded.
  PerformanceScore? score() {
    if (_samples.isEmpty) return null;
    return _scorer.score(_samples);
  }

  /// Clear all recorded samples.
  void reset() {
    _samples.clear();
  }

  /// Number of samples recorded.
  int get sampleCount => _samples.length;
}
