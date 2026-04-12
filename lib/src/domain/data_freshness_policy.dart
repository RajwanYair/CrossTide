import 'package:equatable/equatable.dart';

/// Staleness handling policy when data exceeds the max age.
enum StaleDataPolicy {
  /// Serve stale data with a staleness flag.
  serveStale,

  /// Block and require a fresh fetch.
  blockUntilFresh,

  /// Trigger a background refresh, serve stale in the meantime.
  backgroundRefresh,
}

/// Defines how fresh market data must be for a given use-case,
/// and what to do when data exceeds the maximum acceptable age.
class DataFreshnessPolicy extends Equatable {
  const DataFreshnessPolicy({
    required this.policyId,
    required this.dataCategory,
    required this.maxAgeSeconds,
    required this.stalePolicy,
    this.criticalAgeSeconds,
  });

  final String policyId;

  /// Category of data this policy governs (e.g. "candles", "quote").
  final String dataCategory;

  /// Maximum acceptable data age in seconds before it is considered stale.
  final int maxAgeSeconds;

  final StaleDataPolicy stalePolicy;

  /// Age beyond which data is treated as critically stale, null = not set.
  final int? criticalAgeSeconds;

  DataFreshnessPolicy copyWith({
    String? policyId,
    String? dataCategory,
    int? maxAgeSeconds,
    StaleDataPolicy? stalePolicy,
    int? criticalAgeSeconds,
  }) => DataFreshnessPolicy(
    policyId: policyId ?? this.policyId,
    dataCategory: dataCategory ?? this.dataCategory,
    maxAgeSeconds: maxAgeSeconds ?? this.maxAgeSeconds,
    stalePolicy: stalePolicy ?? this.stalePolicy,
    criticalAgeSeconds: criticalAgeSeconds ?? this.criticalAgeSeconds,
  );

  @override
  List<Object?> get props => [
    policyId,
    dataCategory,
    maxAgeSeconds,
    stalePolicy,
    criticalAgeSeconds,
  ];
}
